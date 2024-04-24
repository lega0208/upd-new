import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, Model, Types } from 'mongoose';
import type { Cache } from 'cache-manager';
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
  GcTasks,
  Page,
  PageMetrics,
  Project,
  Reports,
  Task,
  UxTest,
} from '@dua-upd/db';
import type {
  ApiParams,
  InternalSearchTerm,
  IReports,
  TaskDetailsAggregatedData,
  TaskDetailsData,
  TasksHomeData,
  VisitsByPage,
} from '@dua-upd/types-common';
import {
  arrayToDictionary,
  arrayToDictionaryMultiref,
  dateRangeSplit,
  getAvgSuccessFromLatestTests,
  isNullish,
  percentChange,
  round,
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
    @InjectModel(Page.name, 'defaultConnection')
    private pageModel: Model<PageDocument>,
    @InjectModel(Reports.name, 'defaultConnection')
    private reportsModel: Model<Reports>,
    @InjectModel(GcTasks.name, 'defaultConnection')
    private gcTasksModel: Model<GcTasks>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getTasksHomeData(
    dateRange: string,
    comparisonDateRange: string,
  ): Promise<TasksHomeData> {
    const cacheKey = `getTasksHomeData-${dateRange}-${comparisonDateRange}`;
    const cachedData =
      await this.cacheManager.store.get<TasksHomeData>(cacheKey);

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
      [],
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

    const tasks = await this.db.views.pageVisits.getVisitsDyfNoWithTaskData(
      {
        start,
        end,
      },
      this.taskModel,
    );

    const previousTasks =
      await this.db.views.pageVisits.getVisitsDyfNoWithTaskData(
        {
          start: comparisonStart,
          end: comparisonEnd,
        },
        this.taskModel,
      );

    const callsByTasks: { [key: string]: number } = {};
    const previousCallsByTasks: { [key: string]: number } = {};

    for (const task of tasks as Task[]) {
      callsByTasks[task._id.toString()] = (
        await this.calldriversModel.getCallsByTpcId(dateRange, task.tpc_ids)
      ).reduce((a, b) => a + b.calls, 0);
      previousCallsByTasks[task._id.toString()] = (
        await this.calldriversModel.getCallsByTpcId(
          comparisonDateRange,
          task.tpc_ids,
        )
      ).reduce((a, b) => a + b.calls, 0);
    }

    const uxTests = await this.uxTestModel
      .find({ tasks: { $exists: true, $not: { $size: 0 } } })
      .lean()
      .exec();

    const uxTestsDict = arrayToDictionaryMultiref(uxTests, 'tasks', true);

    const gcTasksData = await this.gcTasksModel
      .aggregate()
      .match({
        date: { $gte: start, $lte: end },
        sampling_task: 'y',
        able_to_complete: {
          $ne: 'I started this survey before I finished my visit',
        },
      })
      .group({
        _id: { gc_task: '$gc_task' },
        total_entries: { $sum: 1 },
        completed_entries: {
          $sum: {
            $cond: [{ $eq: ['$able_to_complete', 'Yes'] }, 1, 0],
          },
        },
      })
      .project({
        _id: 0,
        gc_task: '$_id.gc_task',
        total_entries: 1,
        completed_entries: 1,
      })
      .exec();

    const gcTasksDict = arrayToDictionary(gcTasksData, 'gc_task');
    const previousTasksDict = arrayToDictionary(previousTasks, '_id');

    const task = tasks.map((task) => {
      const calls = callsByTasks[task._id.toString()] ?? 0;
      const previous_calls = previousCallsByTasks[task._id.toString()] ?? 0;
      const previous_visits =
        previousTasksDict[task._id.toString()]?.visits ?? 0;
      const previous_dyf_no =
        previousTasksDict[task._id.toString()]?.dyf_no ?? 0;

      const calls_per_100_visits =
        task.visits > 0 && calls > 0
          ? round((calls / task.visits) * 100, 3)
          : null;
      const dyf_no_per_1000_visits =
        task.visits > 0 && task.dyf_no > 0
          ? round((task.dyf_no / task.visits) * 1000, 3)
          : null;

      const calls_per_100_visits_difference =
        task.visits > 0 && calls > 0
          ? calls_per_100_visits -
            round((previous_calls / previous_visits) * 100, 3)
          : null;
      const dyf_no_per_1000_visits_difference =
        task.visits > 0 && task.dyf_no > 0
          ? dyf_no_per_1000_visits -
            round((previous_dyf_no / previous_visits) * 1000, 3)
          : null;

      const calls_percent_change = percentChange(
        calls / task.visits,
        previous_calls / previous_visits,
      );
      const dyf_no_percent_change = percentChange(
        task.dyf_no / task.visits,
        previous_dyf_no / previous_visits,
      );

      const { gc_survey_participants, gc_survey_completed } =
        task.gc_tasks.reduce(
          (acc, gcTask) => {
            const { total_entries = 0, completed_entries = 0 } =
              gcTasksDict[gcTask.title] || {};

            acc.gc_survey_participants += total_entries;
            acc.gc_survey_completed += completed_entries;

            return acc;
          },
          { gc_survey_participants: 0, gc_survey_completed: 0 },
        );

      const uxTestsForTask = uxTestsDict[task._id.toString()] ?? [];

      const {
        avgTestSuccess,
        latestDate,
        percentChange: latestSuccessPercentChange,
      } = getAvgSuccessFromLatestTests(uxTestsForTask);

      return {
        ...task,
        previous_visits,
        previous_dyf_no,
        calls,
        previous_calls,
        tmf_ranking_index:
          task.visits * 0.1 + calls * 0.6 + gc_survey_participants * 0.3,
        secure_portal: !!task.channel.find(
          (channel) => channel === 'Fully online - portal',
        ),
        ux_testing: !!uxTestsForTask?.find(
          (test) => !isNullish(test.success_rate),
        ),
        cops: !!uxTestsForTask?.find((test) => !test.cops),
        pages_mapped: task.pages?.length ?? 0,
        projects_mapped: task.projects?.length ?? 0,
        latest_ux_success: avgTestSuccess,
        survey: gc_survey_participants ?? 0,
        survey_completed: gc_survey_completed / gc_survey_participants ?? 0,
        calls_per_100_visits,
        dyf_no_per_1000_visits,
        calls_per_100_visits_difference,
        dyf_no_per_1000_visits_difference,
        calls_percent_change,
        dyf_no_percent_change,
        latest_success_rate_change: latestSuccessPercentChange,
      };
    });

    task.sort((a, b) => b.tmf_ranking_index - a.tmf_ranking_index);

    const reports = (await this.reportsModel
      .find(
        { type: 'tasks' },
        {
          _id: 0,
          en_title: 1,
          fr_title: 1,
          en_attachment: 1,
          fr_attachment: 1,
        },
      )
      .exec()) as IReports[];

    const results = {
      dateRange,
      dateRangeData: task.map((task, i) => ({
        ...task,
        tmf_rank: i + 1,
        top_task: i < 50,
      })),
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
        'Attempted to get Task details from API but no id was provided.',
      );
    }

    const cacheKey = `getTaskDetails-${params.id}-${params.dateRange}-${params.comparisonDateRange}`;
    const cachedData =
      await this.cacheManager.store.get<TaskDetailsData>(cacheKey);

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

    const projects = (task?.projects || []).map((project) => ({
      _id: project._id,
      id: project._id,
      title: project.title,
      attachments: project.attachments.map((attachment) => {
        attachment.storage_url = attachment.storage_url?.replace(
          /^https:\/\//,
          '',
        );

        return attachment;
      }),
    }));

    const taskUrls = task?.pages
      .map((page) => 'url' in page && page.url)
      .filter((url) => !!url);

    const taskTpcId = task?.tpc_ids;

    const returnData: TaskDetailsData = {
      _id: task?._id.toString(),
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
        taskTpcId,
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
        taskTpcId,
      ),
      taskSuccessByUxTest: [],
      avgTaskSuccessFromLastTest: null, // todo: better handle N/A
      avgSuccessPercentChange: null,
      dateFromLastTest: null,
      feedbackComments: [],
      searchTerms: await this.getTopSearchTerms(params),
    };

    const uxTests: UxTest[] = (<UxTestDocument[]>task.ux_tests).map((test) =>
      test.toObject(),
    );

    if (uxTests && uxTests.length !== 0) {
      returnData.taskSuccessByUxTest = uxTests
        .map(
          (uxTest) =>
            typeof uxTest === 'object' && {
              _id: uxTest._id,
              _project_id: uxTest.project,
              title: uxTest.title,
              date: uxTest.date,
              test_type: uxTest.test_type,
              success_rate: uxTest.success_rate,
              total_users: uxTest.total_users,
              scenario: uxTest.scenario,
            },
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
      taskUrls,
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
  calldriversTpcId: number[],
): Promise<TaskDetailsAggregatedData> {
  const feedbackByTags = await feedbackModel.getCommentsByTag(
    dateRange,
    pageUrls,
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
      { _id: 1 },
    )
    .lean()
    .exec();

  const pageWithTask = await pageModel
    .find({ tasks: new Types.ObjectId(taskId) })
    .lean()
    .exec();
  const pageLookup = arrayToDictionary(pageWithTask, '_id');

  const determinePageStatus = (page) => {
    if (page?.is_404) return '404';
    if (page?.redirect) return 'Redirected';
    return 'Live';
  };

  const visitedPageIds = new Set();
  const metrics =
    results[0]?.visitsByPage.map((metric) => {
      const pageId = metric._id.toString();
      visitedPageIds.add(pageId);
      const page = pageLookup[pageId];

      return {
        ...metric,
        _id: pageId,
        title: page?.title,
        url: page?.url,
        is404: page?.is_404,
        isRedirect: !!page?.redirect,
        redirect: page?.redirect,
        pageStatus: determinePageStatus(page),
      };
    }) || [];

  const metricsWithoutVisits =
    Object.values(pageLookup)
      .filter((page) => !visitedPageIds.has(page._id.toString()))
      .map((page) => ({
        ...page,
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
        is404: page?.is_404,
        isRedirect: !!page?.redirect,
        redirect: page?.redirect,
        pageStatus: determinePageStatus(page),
      })) || [];

  if (results.length > 0) {
    results[0].visitsByPage = [...metrics, ...metricsWithoutVisits]?.sort(
      (a, b) => a.title?.localeCompare(b.title) || 1,
    ) as VisitsByPage[];
  }

  const documentIds = calldriverDocs.map(({ _id }) => _id);

  const calldriversEnquiry =
    await calldriversModel.getCallsByEnquiryLineFromIds(documentIds);

  const callsByTopic =
    await calldriversModel.getCallsByTopicFromIds(documentIds);

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
