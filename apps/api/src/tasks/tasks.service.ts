import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Cache } from 'cache-manager';
import type {
  CallDriverModel,
  FeedbackModel,
  PageDocument,
  PageMetricsModel,
  ProjectDocument,
  TaskDocument,
  UxTestDocument,
} from '@dua-upd/db';
import {
  CallDriver,
  DbService,
  Feedback,
  Page,
  PageMetrics,
  Project,
  Reports,
  Task,
  UxTest,
} from '@dua-upd/db';
import type {
  TaskDetailsData,
  TasksHomeData,
  TaskDetailsAggregatedData,
  AttachmentData,
  IReports,
} from '@dua-upd/types-common';
import type { ApiParams } from '@dua-upd/types-common';
import {
  dateRangeSplit,
  arrayToDictionary,
  logJson,
  percentChange,
  getAvgSuccessFromLatestTests,
} from '@dua-upd/utils-common';
import { InternalSearchTerm } from '@dua-upd/types-common';

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
    @InjectModel(Page.name, 'defaultConnection')
    private pageModel: Model<PageDocument>,
    @InjectModel(Reports.name, 'defaultConnection')
    private reportsModel: Model<Reports>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getTasksHomeData(
    dateRange: string,
    comparisonDateRange: string
  ): Promise<TasksHomeData> {
    const cacheKey = `getTasksHomeData-${dateRange}-${comparisonDateRange}`;
    const cachedData = await this.cacheManager.store.get<TasksHomeData>(
      cacheKey
    );

    if (cachedData) {
      return cachedData;
    }

    const [start, end] = dateRange.split('/').map((d) => new Date(d));

    const totalVisits = (
      await this.pageMetricsModel
        .aggregate<{ totalVisits: number }>()
        .match({
          tasks: {
            $exists: true,
          },
          date: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        })
        .project({
          date: 1,
          visits: 1,
          tasks: 1,
        })
        .group({
          _id: null,
          totalVisits: {
            $sum: '$visits',
          },
        })
    )?.[0]?.totalVisits;

    const tpcIds = await this.db.collections.tasks
      .find({ tpc_ids: { $not: { $size: 0 } } }, { tpc_ids: 1 })
      .lean()
      .exec();
    const allIds = tpcIds.reduce(
      (idsArray, tpcIds) => idsArray.concat(tpcIds.tpc_ids),
      []
    );
    const uniqueIds = [...new Set(allIds)];

    const totalCalls = (
      await this.db.collections.callDrivers
        .aggregate<{ totalCalls: number }>()
        .match({
          tpc_id: { $in: uniqueIds },
          date: { $gte: new Date(start), $lte: new Date(end) },
        })
        .project({
          date: 1,
          calls: 1,
          tasks: 1,
        })
        .group({
          _id: null,
          totalCalls: {
            $sum: '$calls',
          },
        })
    )?.[0]?.totalCalls;

    const [comparisonStart, comparisonEnd] = comparisonDateRange
      .split('/')
      .map((d) => new Date(d));

    const previousVisits = (
      await this.pageMetricsModel
        .aggregate<{ totalVisits: number }>()
        .match({
          tasks: {
            $exists: true,
          },
          date: {
            $gte: new Date(comparisonStart),
            $lte: new Date(comparisonEnd),
          },
        })
        .project({
          date: 1,
          visits: 1,
          tasks: 1,
        })
        .group({
          _id: null,
          totalVisits: {
            $sum: '$visits',
          },
        })
    )?.[0]?.totalVisits;

    const previousCallDrivers = (
      await this.db.collections.callDrivers
        .aggregate<{ totalCalls: number }>()
        .match({
          tpc_id: { $in: uniqueIds },
          date: {
            $gte: new Date(comparisonStart),
            $lte: new Date(comparisonEnd),
          },
        })
        .project({
          date: 1,
          calls: 1,
          tasks: 1,
        })
        .group({
          _id: null,
          totalCalls: {
            $sum: '$calls',
          },
        })
    )?.[0]?.totalCalls;

    const change = percentChange(totalVisits, previousVisits);

    const changeCallDrivers = percentChange(totalCalls, previousCallDrivers);

    const tasks = await this.db.views.pageVisits.getVisitsWithTaskData(
      {
        start,
        end,
      },
      this.taskModel
    );

    const callsByTasks: { [key: string]: number } = {};

    for (const task of tasks as Task[]) {
      const calls = (
        await this.calldriversModel.getCallsByTpcId(dateRange, task.tpc_ids)
      ).reduce((a, b) => a + b.calls, 0);

      callsByTasks[task._id.toString()] = calls;
    }

    const task = tasks.map((task) => ({
      ...task,
      calls: callsByTasks[task._id.toString()] ?? 0,
    }));

    const reports = (await this.reportsModel
      .find(
        { type: 'tasks' },
        {
          _id: 0,
          en_title: 1,
          fr_title: 1,
          en_attachment: 1,
          fr_attachment: 1,
        }
      )
      .exec()) as IReports[];

    const results = {
      dateRange,
      dateRangeData: task,
      totalVisits,
      percentChange: change,
      totalCalls,
      percentChangeCalls: changeCallDrivers,
      reports,
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
      })
      .populate(['pages', 'ux_tests', 'projects'])
      .exec();

    if (!task) console.error(params.id);

    const projects = (task.projects || []).map((project) => ({
      _id: project._id,
      id: project._id,
      title: project.title,
      attachments: project.attachments.map((attachment) => {
        attachment.storage_url = attachment.storage_url?.replace(
          /^https:\/\//,
          ''
        );

        return attachment;
      }),
    }));

    const taskUrls = task.pages
      .map((page) => 'url' in page && page.url)
      .filter((url) => !!url);

    const taskTpcId = task.tpc_ids;

    const returnData: TaskDetailsData = {
      _id: task._id.toString(),
      title: task.title,
      group: task.group,
      subgroup: task.subgroup,
      topic: task.topic,
      subtopic: task.subtopic,
      sub_subtopic: task.sub_subtopic,
      user_type: task.user_type,
      program: task.program,
      service: task.service,
      user_journey: task.user_journey,
      status: task.status,
      channel: task.channel,
      core: task.core,
      projects,
      dateRange: params.dateRange,
      dateRangeData: await getTaskAggregatedData(
        new Types.ObjectId(params.id),
        this.pageMetricsModel,
        this.calldriversModel,
        this.feedbackModel,
        this.pageModel,
        params.dateRange,
        taskUrls,
        taskTpcId
      ),
      comparisonDateRange: params.comparisonDateRange,
      comparisonDateRangeData: await getTaskAggregatedData(
        new Types.ObjectId(params.id),
        this.pageMetricsModel,
        this.calldriversModel,
        this.feedbackModel,
        this.pageModel,
        params.comparisonDateRange,
        taskUrls,
        taskTpcId
      ),
      taskSuccessByUxTest: [],
      avgTaskSuccessFromLastTest: null, // todo: better handle N/A
      avgSuccessPercentChange: null,
      dateFromLastTest: null,
      feedbackComments: [],
      searchTerms: await this.getTopSearchTerms(params),
    };

    const uxTests: UxTest[] = (<UxTestDocument[]>task.ux_tests).map((test) =>
      test.toObject()
    );

    if (uxTests && uxTests.length !== 0) {
      returnData.taskSuccessByUxTest = uxTests
        .map(
          (uxTest) =>
            typeof uxTest === 'object' && {
              _id: uxTest.project,
              title: uxTest.title,
              date: uxTest.date,
              test_type: uxTest.test_type,
              success_rate: uxTest.success_rate,
              total_users: uxTest.total_users,
              scenario: uxTest.scenario,
            }
        )
        .filter((uxTest) => !!uxTest)
        .sort((a, b) => {
          if (a.date < b.date) return 1;
          if (a.date > b.date) return -1;
          return 0;
        });

      ({
        avgTestSuccess: returnData.avgTaskSuccessFromLastTest,
        latestDate: returnData.dateFromLastTest,
        percentChange: returnData.avgSuccessPercentChange,
      } = getAvgSuccessFromLatestTests(uxTests));
    }

    returnData.feedbackComments = await this.feedbackModel.getComments(
      params.dateRange,
      taskUrls
    );

    await this.cacheManager.set(cacheKey, returnData);

    return returnData;
  }

  async getTopSearchTerms({ dateRange, comparisonDateRange, id }: ApiParams) {
    const [startDate, endDate] = dateRangeSplit(dateRange);
    const [prevStartDate, prevEndDate] = dateRangeSplit(comparisonDateRange);

    const results =
      (await this.pageMetricsModel
        .aggregate<InternalSearchTerm>()
        .project({ date: 1, aa_searchterms: 1, tasks: 1 })
        .match({
          date: {
            $gte: startDate,
            $lte: endDate,
          },
          tasks: new Types.ObjectId(id),
        })
        .unwind('$aa_searchterms')
        .addFields({
          'aa_searchterms.term': {
            $toLower: '$aa_searchterms.term',
          },
        })
        .group({
          _id: '$aa_searchterms.term',
          clicks: {
            $sum: '$aa_searchterms.clicks',
          },
          position: {
            $avg: '$aa_searchterms.position',
          },
        })
        .sort({ clicks: -1 })
        .limit(10)
        .project({
          _id: 0,
          term: '$_id',
          clicks: 1,
          position: {
            $round: ['$position', 2],
          },
        })
        .exec()) || [];

    const prevResults =
      (await this.pageMetricsModel
        .aggregate<Pick<InternalSearchTerm, 'term' | 'clicks'>>()
        .project({ date: 1, aa_searchterms: 1, tasks: 1 })
        .match({
          date: { $gte: prevStartDate, $lte: prevEndDate },
          tasks: new Types.ObjectId(id),
        })
        .unwind('$aa_searchterms')
        .addFields({
          'aa_searchterms.term': {
            $toLower: '$aa_searchterms.term',
          },
        })
        .match({
          'aa_searchterms.term': {
            $in: results.map(({ term }) => term),
          },
        })
        .group({
          _id: '$aa_searchterms.term',
          clicks: {
            $sum: '$aa_searchterms.clicks',
          },
        })
        .project({
          _id: 0,
          term: '$_id',
          clicks: 1,
        })
        .exec()) || [];

    const prevResultsDict = arrayToDictionary(prevResults, 'term');

    return results.map((result) => {
      const prevClicks = prevResultsDict[result.term]?.clicks;
      const clicksChange =
        typeof prevClicks === 'number' && prevClicks !== 0
          ? Math.round(((result.clicks - prevClicks) / prevClicks) * 100) / 100
          : null;

      return {
        ...result,
        clicksChange,
      };
    });
  }
}

async function getTaskAggregatedData(
  taskId: Types.ObjectId,
  pageMetricsModel: PageMetricsModel,
  calldriversModel: CallDriverModel,
  feedbackModel: FeedbackModel,
  pageModel: Model<Page>,
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
    .project({
      date: 1,
      page: 1,
      visits: 1,
      tasks: 1,
      dyf_yes: 1,
      dyf_no: 1,
      fwylf_cant_find_info: 1,
      fwylf_error: 1,
      fwylf_hard_to_understand: 1,
      fwylf_other: 1,
      gsc_total_clicks: 1,
      gsc_total_impressions: 1,
      gsc_total_ctr: 1,
      gsc_total_position: 1,
    })
    .match({
      date: dateQuery,
      tasks: taskId,
    })
    .group({
      _id: '$page',
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

  const pageWithTask = await pageModel
    .find({ tasks: new Types.ObjectId(taskId) })
    .lean()
    .exec();

  const pageLookup = arrayToDictionary(pageWithTask, '_id');

  if (results[0]?.visitsByPage) {
    const metricsMapped = results[0].visitsByPage.map((metric) => {
      const page = pageLookup[metric._id.toString()];
      delete pageLookup[metric._id.toString()];

      return {
        ...metric,
        _id: metric._id.toString(),
        title: page.title,
        url: page.url,
      };
    });

    const missingPages = Object.values(pageLookup).map((page) => ({
      _id: page._id.toString(),
      title: page.title,
      url: page.url,
      visits: 0,
      dyfYes: 0,
      dyfNo: 0,
      fwylfCantFindInfo: 0,
      fwylfError: 0,
      fwylfHardToUnderstand: 0,
      fwylfOther: 0,
      gscTotalClicks: 0,
      gscTotalImpressions: 0,
      gscTotalCtr: 0,
      gscTotalPosition: 0,
    }));

    results[0].visitsByPage = [
      ...(metricsMapped || []),
      ...(missingPages || []),
    ].sort((a, b) => a.title.localeCompare(b.title));
  }

  const documentIds = calldriverDocs.map(({ _id }) => _id);

  const calldriversEnquiry =
    await calldriversModel.getCallsByEnquiryLineFromIds(documentIds);

  const callsByTopic = await calldriversModel.getCallsByTopicFromIds(
    documentIds
  );

  const totalCalldrivers = calldriversEnquiry.reduce((a, b) => a + b.calls, 0);

  const visitsByDay = await pageMetricsModel
    .aggregate()
    .match({ date: dateQuery, tasks: taskId })
    .group({
      _id: '$date',
      visits: { $sum: '$visits' },
    })
    .project({
      _id: 0,
      date: '$_id',
      visits: 1,
    })
    .sort({ date: 1 })
    .exec();

  const dyfByDay = await pageMetricsModel
    .aggregate()
    .match({ date: dateQuery, tasks: taskId })
    .group({
      _id: '$date',
      dyf_yes: { $sum: '$dyf_yes' },
      dyf_no: { $sum: '$dyf_no' },
      dyf_submit: { $sum: '$dyf_submit' },
    })
    .project({
      _id: 0,
      date: '$_id',
      dyf_yes: 1,
      dyf_no: 1,
      dyf_submit: 1,
    })
    .sort({ date: 1 })
    .exec();

  const calldriversByDay = await calldriversModel
    .aggregate()
    .match({
      date: { $gte: startDate, $lte: endDate },
      tpc_id: { $in: calldriversTpcId },
    })
    .group({
      _id: '$date',
      calls: {
        $sum: '$calls',
      },
    })
    .project({
      _id: 0,
      date: '$_id',
      calls: 1,
    })
    .sort({ date: 1 })
    .exec();

  return {
    ...results[0],
    calldriversEnquiry,
    callsByTopic,
    totalCalldrivers,
    feedbackByTags,
    visitsByDay,
    dyfByDay,
    calldriversByDay,
  };
}
