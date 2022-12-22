import {
  Document,
  model as mongooseModel,
  Model,
  ObjectId,
  PipelineStage,
  Schema,
  Types,
} from 'mongoose';
import dayjs, { ManipulateType } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Page, PageMetrics, Task } from '../';
import { arrayToDictionary, logJson, sum } from '@dua-upd/utils-common';
dayjs.extend(utc);

/**
 * classes for defining of on-demand materialized views
 */

type DateRange = {
  start: string | Date;
  end: string | Date;
};

export interface DbViewType {
  _id: DateRange;
  lastUpdated: Date;
}

export interface DbViewConfig<T extends DbViewType, Source> {
  collectionName: `view_${string}`;
  sourceModel: Model<Source>;
  model: Model<T>;
  pipelineCreator: (dateRange: DateRange) => PipelineStage[];
  maxAge: [number, ManipulateType];
}

export abstract class DbView<T extends DbViewType, Source> {
  collectionName: `view_${string}`;
  sourceModel: Model<Source>;
  model: Model<T>;
  pipelineCreator: (dateRange: DateRange) => PipelineStage[];
  maxAge: [number, ManipulateType];

  protected constructor(config: DbViewConfig<T, Source>) {
    this.collectionName = config.collectionName;
    this.sourceModel = config.sourceModel;
    this.model = config.model;
    this.pipelineCreator = config.pipelineCreator;
    this.maxAge = config.maxAge;
  }

  private async getLastUpdated(dateRange: DateRange) {
    const results = await this.model
      .findOne(
        {
          _id: {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          },
        },
        { lastUpdated: 1 }
      )
      .lean()
      .exec();

    console.log('getLastUpdated:');
    logJson(results);

    return results?.lastUpdated || null;
  }

  private async needsUpdate(dateRange: DateRange) {
    const lastUpdated = await this.getLastUpdated(dateRange);

    if (!lastUpdated) {
      return true;
    }

    const expiryDate = dayjs.utc(lastUpdated).add(...this.maxAge);

    return dayjs.utc().isAfter(expiryDate);
  }

  async getOrUpdate(dateRange: DateRange) {
    if (await this.needsUpdate(dateRange)) {
      await this.sourceModel
        .aggregate<T>(this.pipelineCreator(dateRange))
        .exec();
    }

    const queryId = {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end),
    };

    return (await this.model.findOne({ _id: queryId }).lean().exec()) as T;
  }

  async clearAll() {
    return this.model.deleteMany({});
  }
}

const viewsBaseSchema = {
  _id: {
    start: Date,
    end: Date,
  },
  lastUpdated: Date,
};

// Page Visits view, for aggregating individual page visits over a date range

export interface PageVisits extends DbViewType {
  // the _id in the pageVisits objects are Page references and not ids from pages_metrics
  pageVisits: (Page & { visits: number })[];
}

const COLLECTION_NAME = 'view_page_visits' as const;

export class PageVisitsView
  extends DbView<PageVisits, PageMetrics>
  implements DbViewConfig<PageVisits, PageMetrics>
{
  constructor(
    pageVisitsModel: Model<PageVisits>,
    pageMetricsModel: Model<PageMetrics>
  ) {
    const collectionName = COLLECTION_NAME;
    const maxAge: [number, ManipulateType] = [1, 'year'];
    const sourceModel = pageMetricsModel;
    const model = pageVisitsModel;
    const pipelineCreator = (dateRange: DateRange) => [
      {
        $match: {
          date: {
            $gte: new Date(dateRange.start),
            $lte: new Date(dateRange.end),
          },
          page: {
            $exists: true,
          },
        },
      },
      {
        $project: {
          page: 1,
          visits: 1,
        },
      },
      {
        $group: {
          _id: '$page',
          visits: {
            $sum: '$visits',
          },
        },
      },
      {
        $sort: {
          visits: -1 as const,
        },
      },
      {
        $group: {
          _id: null,
          pageVisits: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $project: {
          _id: {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          },
          pageVisits: '$pageVisits',
          lastUpdated: '$$NOW',
        },
      },
      {
        $merge: {
          into: COLLECTION_NAME,
          on: '_id',
        },
      },
    ];

    super({
      collectionName,
      maxAge,
      sourceModel,
      model,
      pipelineCreator,
    });
  }

  async getVisitsWithPageData(dateRange: DateRange, pageModel: Model<Page>) {
    const visits = (await this.getOrUpdate(dateRange))?.pageVisits || [];

    const visitsDictionary = arrayToDictionary(visits, '_id');

    const pagesProjection = {
      url: 1,
      all_urls: 1,
      title: 1,
      tasks: 1,
      projects: 1,
      ux_tests: 1,
    };

    const pages =
      (await pageModel.find({}, pagesProjection).lean().exec()) || [];

    return pages
      .map((page) => ({
        ...page,
        visits: visitsDictionary[page._id.toString()]?.visits || 0,
      }))
      .sort((a, b) => b.visits - a.visits);
  }

  async getVisitsWithTaskData(dateRange: DateRange, taskModel: Model<Task>) {
    const visits = (await this.getOrUpdate(dateRange))?.pageVisits || [];

    const visitsDictionary = arrayToDictionary(visits, '_id');

    const tasks = (await taskModel.find().exec()) || [];

    const tasksWithVisits = await Promise.all(
      tasks.map((task) =>
        task.populate('pages').then((task) => {
          const pageVisits = task.pages?.map(
            (page) => visitsDictionary[page._id.toString()]?.visits || 0
          ) || [];

          return {
            ...task.toObject(),
            visits: sum(pageVisits),
          };
        })
      )
    );

    return tasksWithVisits.sort((a, b) => b.visits - a.visits);
  }
}

export const PageVisitsViewSchema = new Schema<PageVisits>(
  {
    ...viewsBaseSchema,
    pageVisits: [{ _id: Types.ObjectId, visits: Number }],
  },
  { collection: COLLECTION_NAME }
);

PageVisitsViewSchema.index({ _id: 'hashed' });
