import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types, FilterQuery } from 'mongoose';
import {
  GscSearchTermMetrics,
  AccumulatorOperator,
  AASearchTermMetrics,
  IPageMetrics,
  ActivityMapMetrics,
} from '@dua-upd/types-common';
import { Page } from './page.schema';
import { Task } from './task.schema';
import { Project } from './project.schema';
import { UxTest } from './ux-test.schema';
import { DateRange } from '@dua-upd/utils-common';
import { PageMetricsTS } from './page-metrics-ts.schema';

export type PageMetricsDocument = PageMetrics & Document;

@Schema({ collection: 'pages_metrics' })
export class PageMetrics implements IPageMetrics {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ required: true, type: String, index: true })
  url = '';

  @Prop({ required: true, type: Date, index: true })
  date = new Date(0);

  @Prop({ type: Number })
  dyf_submit = 0;

  @Prop({ type: Number })
  dyf_yes = 0;

  @Prop({ type: Number })
  dyf_no = 0;

  @Prop({ type: Number })
  views = 0;

  @Prop({ type: Number })
  visits = 0;

  @Prop({ type: Number })
  visitors = 0;

  @Prop({ type: Number })
  average_time_spent = 0;

  @Prop({ type: Number })
  bouncerate = 0;

  @Prop({ type: Number })
  rap_initiated = 0;

  @Prop({ type: Number })
  rap_completed = 0;

  @Prop({ type: Number })
  nav_menu_initiated = 0;

  @Prop({ type: Number })
  rap_cant_find = 0;

  @Prop({ type: Number })
  rap_login_error = 0;

  @Prop({ type: Number })
  rap_other = 0;

  @Prop({ type: Number })
  rap_sin = 0;

  @Prop({ type: Number })
  rap_info_missing = 0;

  @Prop({ type: Number })
  rap_securekey = 0;

  @Prop({ type: Number })
  rap_other_login = 0;

  @Prop({ type: Number })
  rap_gc_key = 0;

  @Prop({ type: Number })
  rap_info_wrong = 0;

  @Prop({ type: Number })
  rap_spelling = 0;

  @Prop({ type: Number })
  rap_access_code = 0;

  @Prop({ type: Number })
  rap_link_not_working = 0;

  @Prop({ type: Number })
  rap_404 = 0;

  @Prop({ type: Number })
  rap_blank_form = 0;

  @Prop({ type: Number })
  fwylf_cant_find_info = 0;

  @Prop({ type: Number })
  fwylf_other = 0;

  @Prop({ type: Number })
  fwylf_hard_to_understand = 0;

  @Prop({ type: Number })
  fwylf_error = 0;

  @Prop({ type: Number })
  visits_geo_ab = 0;

  @Prop({ type: Number })
  visits_geo_bc = 0;

  @Prop({ type: Number })
  visits_geo_mb = 0;

  @Prop({ type: Number })
  visits_geo_nb = 0;

  @Prop({ type: Number })
  visits_geo_nl = 0;

  @Prop({ type: Number })
  visits_geo_ns = 0;

  @Prop({ type: Number })
  visits_geo_nt = 0;

  @Prop({ type: Number })
  visits_geo_nu = 0;

  @Prop({ type: Number })
  visits_geo_on = 0;

  @Prop({ type: Number })
  visits_geo_outside_canada = 0;

  @Prop({ type: Number })
  visits_geo_pe = 0;

  @Prop({ type: Number })
  visits_geo_qc = 0;

  @Prop({ type: Number })
  visits_geo_sk = 0;

  @Prop({ type: Number })
  visits_geo_us = 0;

  @Prop({ type: Number })
  visits_geo_yt = 0;

  @Prop({ type: Number })
  visits_referrer_other = 0;

  @Prop({ type: Number })
  visits_referrer_searchengine = 0;

  @Prop({ type: Number })
  visits_referrer_social = 0;

  @Prop({ type: Number })
  visits_referrer_typed_bookmarked = 0;

  @Prop({ type: Number })
  visits_device_other = 0;

  @Prop({ type: Number })
  visits_device_desktop = 0;

  @Prop({ type: Number })
  visits_device_mobile = 0;

  @Prop({ type: Number })
  visits_device_tablet = 0;

  @Prop({ type: Number })
  gsc_total_clicks = 0;

  @Prop({ type: Number })
  gsc_total_ctr = 0;

  @Prop({ type: Number })
  gsc_total_impressions = 0;

  @Prop({ type: Number })
  gsc_total_position = 0;

  @Prop({
    type: [
      {
        clicks: Number,
        ctr: Number,
        impressions: Number,
        position: Number,
        term: String,
      },
    ],
  })
  gsc_searchterms: GscSearchTermMetrics[] = [];

  @Prop({ type: [{ term: String, clicks: Number, position: Number }] })
  aa_searchterms?: AASearchTermMetrics[];

  @Prop({ type: Types.ObjectId, ref: 'Page', index: true })
  page?: Types.ObjectId | Page;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }], index: true })
  tasks?: Types.ObjectId[] | Task[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }], index: true })
  projects?: Types.ObjectId[] | Project[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UxTest' }], index: true })
  ux_tests?: Types.ObjectId[] | UxTest[];

  @Prop({
    type: [
      {
        link: String,
        clicks: Number,
      },
    ],
  })
  activity_map?: ActivityMapMetrics[] = [];
}

export const PageMetricsSchema = SchemaFactory.createForClass(PageMetrics);

PageMetricsSchema.index({ date: 1, url: 1 }, { unique: true });
PageMetricsSchema.index(
  { date: 1, page: 1 },
  { background: true, partialFilterExpression: { page: { $exists: true } } }
);
PageMetricsSchema.index(
  { url: 1, page: 1 },
  { background: true, partialFilterExpression: { page: { $exists: true } } }
);
PageMetricsSchema.index(
  { url: 1, projects: 1 },
  { background: true, partialFilterExpression: { projects: { $exists: true } } }
);
PageMetricsSchema.index(
  { url: 1, tasks: 1 },
  { background: true, partialFilterExpression: { tasks: { $exists: true } } }
);
PageMetricsSchema.index(
  { url: 1, ux_tests: 1 },
  { background: true, partialFilterExpression: { ux_tests: { $exists: true } } }
);
// This index is specifically for maintaining references when updating airtable data.
// It's a partial index that includes only documents with tasks/projects/ux_tests arrays that aren't empty,
//  which makes it much faster when querying for them (and might even help for regular data fetching)
PageMetricsSchema.index(
  { date: 1 },
  {
    name: 'date_airtable',
    background: true,
    partialFilterExpression: {
      $or: [
        { 'tasks.0': { $exists: true } },
        { 'projects.0': { $exists: true } },
        { 'ux_tests.0': { $exists: true } },
      ],
    },
  }
);

export function getPageMetricsModel() {
  return model(PageMetrics.name, PageMetricsSchema);
}

export type MetricsConfig<T> = {
  [key in AccumulatorOperator]?: keyof Partial<T>;
};

export async function getAggregatedPageMetrics<T>(
  this: PageMetricsModel,
  dateRange: string,
  selectedMetrics: (keyof T | MetricsConfig<T>)[],
  pagesFilter?: FilterQuery<PageMetrics>,
  sortConfig?: { [key in keyof Partial<T>]: 1 | -1 }
): Promise<T[]> {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const metricsProjections: Record<string, number> = {};
  const metricsGroupAggregations: Record<
    string,
    { [key in AccumulatorOperator]?: string }
  > = {};
  const metricsSort: Record<string, 1 | -1> = sortConfig || {};

  for (const [i, metric] of selectedMetrics.entries()) {
    const metricName =
      typeof metric === 'string' ? metric : Object.values(metric)[0];
    const metricOperator =
      typeof metric === 'string' ? '$sum' : Object.keys(metric)[0];

    metricsProjections[metricName] = 1;
    metricsGroupAggregations[metricName] = {
      [metricOperator]: `$${metricName}`,
    };

    if (!sortConfig && i === 0) {
      metricsSort[metricName] = -1;
    }
  }
  const pagesFilterQuery = pagesFilter || {};

  return await this.aggregate<T>()
    .match({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
      page: { $exists: true },
      ...pagesFilterQuery,
    })
    .project({
      page: 1,
      date: 1,
      ...metricsProjections,
    })
    .group({
      _id: '$page',
      ...metricsGroupAggregations,
    })
    .lookup({
      from: 'pages',
      localField: '_id',
      foreignField: '_id',
      as: 'page',
    })
    .project({
      ...metricsProjections,
      url: {
        $first: '$page.url',
      },
      title: {
        $first: '$page.title',
      },
      all_urls: {
        $first: '$page.all_urls',
      },
    })
    .sort(metricsSort)
    .exec();
}

export async function toTimeSeries(
  this: PageMetricsModel,
  dateRange: DateRange<Date>
) {
  return await this.aggregate<PageMetricsTS>()
    .match({ date: { $gte: dateRange.start, $lte: dateRange.end } })
    .addFields({
      meta: {
        url: '$url',
        page: '$page',
        projects: {
          $cond: {
            if: {
              $eq: [{ $size: { $ifNull: ['$projects', []] } }, 0],
            },
            then: '$$REMOVE',
            else: '$projects',
          },
        },
        tasks: {
          $cond: {
            if: {
              $eq: [{ $size: { $ifNull: ['$tasks', []] } }, 0],
            },
            then: '$$REMOVE',
            else: '$tasks',
          },
        },
        ux_tests: {
          $cond: {
            if: {
              $eq: [{ $size: { $ifNull: ['$ux_tests', []] } }, 0],
            },
            then: '$$REMOVE',
            else: '$ux_tests',
          },
        },
      },
      average_time_spent: {
        $ifNull: [{ $round: ['$average_time_spent', 2] }, 0],
      },
      bouncerate: { $ifNull: [{ $round: ['$bouncerate', 2] }, 0] },
      gsc_total_ctr: { $ifNull: [{ $round: ['$gsc_total_ctr', 2] }, 0] },
      gsc_total_impressions: {
        $ifNull: [{ $round: ['$gsc_total_impressions', 2] }, 0],
      },
      gsc_total_position: {
        $ifNull: [{ $round: ['$gsc_total_position', 2] }, 0],
      },
      gsc_searchterms: {
        $cond: {
          if: {
            $eq: [{ $size: { $ifNull: ['$gsc_searchterms', []] } }, 0],
          },
          then: '$$REMOVE',
          else: {
            $map: {
              input: '$gsc_searchterms',
              as: 'searchterm',
              in: {
                clicks: '$$searchterm.clicks',
                ctr: { $round: ['$$searchterm.ctr', 2] },
                impressions: '$$searchterm.impressions',
                position: { $round: ['$$searchterm.position', 2] },
                term: '$$searchterm.term',
              },
            },
          },
        },
      },
      aa_searchterms: {
        $cond: {
          if: {
            $eq: [{ $size: { $ifNull: ['$aa_searchterms', []] } }, 0],
          },
          then: '$$REMOVE',
          else: {
            $map: {
              input: '$aa_searchterms',
              as: 'searchterm',
              in: {
                term: '$$searchterm.term',
                clicks: '$$searchterm.clicks',
                position: '$$searchterm.position',
              },
            },
          },
        },
      },
    })
    .project({
      page: 0,
      projects: 0,
      tasks: 0,
      ux_tests: 0,
      url: 0,
    })
    .exec();
}

PageMetricsSchema.statics = {
  getAggregatedPageMetrics,
  toTimeSeries,
};

export type PageMetricsModel = Model<PageMetrics> & {
  getAggregatedPageMetrics: typeof getAggregatedPageMetrics;
  toTimeSeries: typeof toTimeSeries;
};

PageMetricsSchema.static('toTimeSeries', toTimeSeries);
