import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Cache } from 'cache-manager';
import type {
  CallDriverModel,
  FeedbackModel,
  PageMetricsModel,
  ProjectDocument,
  TaskDocument,
  UxTestDocument,
} from '@dua-upd/db';
import {
  CallDriver,
  DbService,
  Feedback,
  PageMetrics,
  Project,
  Task,
  UxTest,
} from '@dua-upd/db';
import type {
  TaskDetailsData,
  TasksHomeData,
  TasksHomeAggregatedData,
  TaskDetailsAggregatedData,
} from '@dua-upd/types-common';
import type { ApiParams } from '@dua-upd/types-common';
import {
  getAvgSuccessFromLastTests,
  getLatestTest,
  dateRangeSplit,
} from '@dua-upd/utils-common';

@Injectable()
export class TasksService {
  constructor(
    private db: DbService,
    @InjectModel(Project.name, 'defaultConnection')
    private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name, 'defaultConnection')
    private taskModel: Model<TaskDocument>,
    @InjectModel(UxTest.name, 'defaultConnection')
    private uxTestModel: Model<UxTestDocument>,
    @InjectModel(PageMetrics.name, 'defaultConnection')
    private pageMetricsModel: PageMetricsModel,
    @InjectModel(Feedback.name, 'defaultConnection')
    private feedbackModel: FeedbackModel,
    @InjectModel(CallDriver.name, 'defaultConnection')
    private calldriversModel: CallDriverModel,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getTasksHomeData(dateRange: string): Promise<TasksHomeData> {
    const cacheKey = `getTasksHomeData-${dateRange}`;
    const cachedData = await this.cacheManager.store.get<TasksHomeData>(
      cacheKey
    );

    if (cachedData) {
      return cachedData;
    }

    const [start, end] = dateRange.split('/').map((d) => new Date(d));

    const tasks = await this.db.views.pageVisits.getVisitsWithTaskData(
      {
        start,
        end,
      },
      this.taskModel
    );

    const results = {
      dateRange,
      dateRangeData: tasks,
    };

    await this.cacheManager.set(cacheKey, results);

    return results;
  }

  async getTaskDetails(params: ApiParams): Promise<TaskDetailsData> {
    if (!params.id) {
      throw Error(
        'Attempted to get Task details from API but no id was provided.'
      );
    }

    const cacheKey = `getTaskDetails-${params.id}-${params.dateRange}-${params.comparisonDateRange}`;
    const cachedData = await this.cacheManager.store.get<TaskDetailsData>(
      cacheKey
    );

    if (cachedData) {
      return cachedData;
    }

    const task = await this.taskModel
      .findById(new Types.ObjectId(params.id), {
        airtable_id: 0,
        user_type: 0,
      })
      .populate(['pages', 'ux_tests', 'projects'])
      .exec();

    const projects = (task.projects || [])
      .map((project) => {
        return { id: project._id, title: project.title };
      })
      .flat();

    const taskUrls = task.pages
      .map((page) => {
        if ('all_urls' in page && page.all_urls.length) {
          return page.all_urls;
        }

        if ('url' in page && page.url) {
          return page.url;
        }
      })
      .flat()
      .filter((url) => !!url);

    const taskTpcId = task.tpc_ids;

    const returnData: TaskDetailsData = {
      _id: task._id.toString(),
      title: task.title,
      projects,
      dateRange: params.dateRange,
      dateRangeData: await getTaskAggregatedData(
        this.pageMetricsModel,
        this.calldriversModel,
        this.feedbackModel,
        params.dateRange,
        taskUrls,
        taskTpcId
      ),
      comparisonDateRange: params.comparisonDateRange,
      comparisonDateRangeData: await getTaskAggregatedData(
        this.pageMetricsModel,
        this.calldriversModel,
        this.feedbackModel,
        params.comparisonDateRange,
        taskUrls,
        taskTpcId
      ),
      taskSuccessByUxTest: [],
      avgTaskSuccessFromLastTest: null, // todo: better handle N/A
      dateFromLastTest: null,
      feedbackComments: [],
    };

    const uxTests: UxTest[] = (<UxTestDocument[]>task.ux_tests).map((test) =>
      test.toObject()
    );

    if (uxTests && uxTests.length !== 0) {
      returnData.taskSuccessByUxTest = uxTests
        .map(
          (uxTest) =>
            typeof uxTest === 'object' && {
              title: uxTest.title,
              date: uxTest.date,
              test_type: uxTest.test_type,
              success_rate: uxTest.success_rate,
              total_users: uxTest.total_users,
              scenario: uxTest.scenario,
              attachments: uxTest.attachments,
            }
        )
        .filter((uxTest) => !!uxTest)
        .sort((a, b) => {
          if (a.date < b.date) return 1;
          if (a.date > b.date) return -1;
          return 0;
        });

      // *** @@@
      // move functions to uxTests statics
      returnData.dateFromLastTest = getLatestTest(uxTests)?.date || null;
      returnData.avgTaskSuccessFromLastTest =
        getAvgSuccessFromLastTests(uxTests);

      returnData.feedbackComments = await this.feedbackModel.getComments(
        params.dateRange,
        taskUrls
      );
    }

    await this.cacheManager.set(cacheKey, returnData);

    return returnData;
  }
}

async function getTaskAggregatedData(
  pageMetricsModel: PageMetricsModel,
  calldriversModel: CallDriverModel,
  feedbackModel: FeedbackModel,
  dateRange: string,
  pageUrls: string[],
  calldriversTpcId: number[]
): Promise<TaskDetailsAggregatedData> {
  const feedbackByTags = await feedbackModel.getCommentsByTag(
    dateRange,
    pageUrls
  );

  const [startDate, endDate] = dateRangeSplit(dateRange);

  const dateQuery: FilterQuery<Date> = {
    $gte: startDate,
    $lte: endDate,
  };

  const results = await pageMetricsModel
    .aggregate<TaskDetailsAggregatedData>()
    .sort({ date: -1, url: 1 })
    .match({
      date: dateQuery,
      url: { $in: pageUrls },
    })
    .group({
      _id: '$url',
      page: { $first: '$page' },
      visits: { $sum: '$visits' },
      dyfYes: { $sum: '$dyf_yes' },
      dyfNo: { $sum: '$dyf_no' },
      fwylfCantFindInfo: { $sum: '$fwylf_cant_find_info' },
      fwylfError: { $sum: '$fwylf_error' },
      fwylfHardToUnderstand: { $sum: '$fwylf_hard_to_understand' },
      fwylfOther: { $sum: '$fwylf_other' },
      gscTotalClicks: { $sum: '$gsc_total_clicks' },
      gscTotalImpressions: { $sum: '$gsc_total_impressions' },
      gscTotalCtr: { $avg: '$gsc_total_ctr' },
      gscTotalPosition: { $avg: '$gsc_total_position' },
    })
    .lookup({
      from: 'pages',
      localField: 'page',
      foreignField: '_id',
      as: 'page',
    })
    .unwind('$page')
    .replaceRoot({
      $mergeObjects: [
        '$$ROOT',
        { _id: '$page._id', title: '$page.title', url: '$page.url' },
      ],
    })
    .project({ page: 0 })
    .sort({ title: 1 })
    .group({
      _id: 'null',
      visits: { $sum: '$visits' },
      dyfYes: { $sum: '$dyfYes' },
      dyfNo: { $sum: '$dyfNo' },
      fwylfCantFindInfo: { $sum: '$fwylfCantFindInfo' },
      fwylfError: { $sum: '$fwylfError' },
      fwylfHardToUnderstand: { $sum: '$fwylfHardToUnderstand' },
      fwylfOther: { $sum: '$fwylfOther' },
      gscTotalClicks: { $sum: '$gscTotalClicks' },
      gscTotalImpressions: { $sum: '$gscTotalImpressions' },
      gscTotalCtr: { $avg: '$gscTotalCtr' },
      gscTotalPosition: { $avg: '$gscTotalPosition' },
      visitsByPage: { $push: '$$ROOT' },
    })
    .project({ _id: 0 })
    .exec();

  const calldriverDocs = await calldriversModel
    .find(
      {
        tpc_id: calldriversTpcId,
        date: dateQuery,
      },
      { _id: 1 }
    )
    .lean()
    .exec();

  const documentIds = calldriverDocs.map(({ _id }) => _id);

  const calldriversEnquiry =
    await calldriversModel.getCallsByEnquiryLineFromIds(documentIds);

  const callsByTopic = await calldriversModel.getCallsByTopicFromIds(
    documentIds
  );

  const totalCalldrivers = calldriversEnquiry.reduce((a, b) => a + b.calls, 0);

  return {
    ...results[0],
    calldriversEnquiry,
    callsByTopic,
    totalCalldrivers,
    feedbackByTags,
  };
}
