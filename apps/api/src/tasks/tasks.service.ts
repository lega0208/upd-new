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
  TaskDetailsMetrics,
  TaskDetailsData,
  TasksHomeData,
} from '@dua-upd/types-common';
import {
  arrayToDictionary,
  arrayToDictionaryMultiref,
  dateRangeSplit,
  getAvgSuccessFromLatestTests,
  isNullish,
  parseDateRangeString,
  percentChange,
  round,
} from '@dua-upd/utils-common';
import { FeedbackService } from '@dua-upd/api/feedback';
import { omit } from 'rambdax';
import { compressString, decompressString } from '@dua-upd/node-utils';

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
    private feedbackService: FeedbackService,
  ) {}

  async getTasksHomeData(
    dateRange: string,
    comparisonDateRange: string,
  ): Promise<TasksHomeData> {
    const cacheKey = `getTasksHomeData-${dateRange}-${comparisonDateRange}`;

    const cachedData = await this.cacheManager.store.get<string>(cacheKey).then(
      async (cachedData) =>
        cachedData &&
        // it's actually still a string here, but we want to avoid deserializing it
        // and then reserializing it to send over http while still keeping our types intact
        ((await decompressString(cachedData)) as unknown as TasksHomeData),
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
            $gte: start,
            $lte: end,
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

    const totalCalls = (
      await this.db.collections.callDrivers
        .aggregate<{ totalCalls: number }>()
        .match({
          tasks: { $exists: true },
          date: { $gte: start, $lte: end },
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
            $gte: comparisonStart,
            $lte: comparisonEnd,
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
          tasks: { $exists: true },
          date: { $gte: comparisonStart, $lte: comparisonEnd },
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

    const callsByTask = await this.calldriversModel.getCallsByTask(dateRange);

    const previousCallsByTask =
      await this.calldriversModel.getCallsByTask(comparisonDateRange);

    const callsByTaskDict = arrayToDictionary(callsByTask, 'task');
    const previousCallsByTaskDict = arrayToDictionary(
      previousCallsByTask,
      'task',
    );

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
      const taskId = task._id.toString();
      const calls = callsByTaskDict[taskId]?.calls ?? 0;
      const previous_calls = previousCallsByTaskDict[taskId]?.calls ?? 0;

      const previous_visits = previousTasksDict[taskId]?.visits ?? 0;
      const previous_dyf_no = previousTasksDict[taskId]?.dyf_no ?? 0;

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

      const uxTestsForTask = uxTestsDict[taskId] ?? [];

      const { avgTestSuccess, percentChange: latest_success_rate } =
        getAvgSuccessFromLatestTests(uxTestsForTask);

      const latest_success_rate_percent_change = percentChange(
        avgTestSuccess,
        avgTestSuccess - latest_success_rate,
      );

      const latest_success_rate_difference = latest_success_rate * 100;

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
        latest_success_rate_difference,
        latest_success_rate_percent_change,
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

    await this.cacheManager.set(
      cacheKey,
      await compressString(JSON.stringify(results)),
    );

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

    const taskId = new Types.ObjectId(params.id);

    const task = await this.taskModel
      .findById(taskId, {
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

    const pages = await this.pageModel
      .find(
        { tasks: taskId },
        {
          title: 1,
          url: 1,
          lang: 1,
          is_404: 1,
          redirect: 1,
          owners: 1,
          sections: 1,
        },
      )
      .lean()
      .exec();

    const aggregatedMetrics =
      await this.pageMetricsModel.getAggregatedMetricsWithComparison(
        params.dateRange,
        params.comparisonDateRange,
        { tasks: new Types.ObjectId(taskId) },
        pages,
      );

    const {
      dyfYes = 0,
      dyfNo = 0,
      dyfNoComparison = null,
      dyfYesComparison = null,
      visits = 0,
      visitsComparison = null,
    } = aggregatedMetrics || {};

    const feedbackByPage = (
      await this.feedbackService.getNumCommentsByPage(
        params.dateRange,
        params.comparisonDateRange,
        { tasks: taskId },
      )
    ).map(({ _id, title, url, sum, percentChange }) => ({
      _id: _id.toString(),
      title,
      url,
      sum,
      percentChange,
    }));

    const feedbackByDay = (
      await this.feedbackModel.getCommentsByDay(params.dateRange, {
        tasks: taskId,
      })
    ).map(({ date, sum }) => ({
      date: date.toISOString(),
      sum,
    }));

    const mostRelevantCommentsAndWords =
      await this.feedbackService.getMostRelevantCommentsAndWords({
        dateRange: parseDateRangeString(params.dateRange),
        type: 'task',
        id: params.id,
      });

    const numComments =
      mostRelevantCommentsAndWords.en.comments.length +
      mostRelevantCommentsAndWords.fr.comments.length;

    const { start: prevDateRangeStart, end: prevDateRangeEnd } =
      parseDateRangeString(params.comparisonDateRange);

    const numPreviousComments = await this.feedbackModel
      .countDocuments({
        date: { $gte: prevDateRangeStart, $lte: prevDateRangeEnd },
      })
      .exec();

    const numCommentsPercentChange = numPreviousComments
      ? percentChange(numComments, numPreviousComments)
      : null;

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
      dateRangeData: {
        ...(await getTaskAggregatedData(
          new Types.ObjectId(params.id),
          this.pageMetricsModel,
          this.calldriversModel,
          this.feedbackModel,
          this.pageModel,
          params.dateRange,
          taskUrls,
          taskTpcId,
        )),
        visits,
        dyfYes,
        dyfNo,
      },
      comparisonDateRange: params.comparisonDateRange,
      comparisonDateRangeData: {
        ...(await getTaskAggregatedData(
          new Types.ObjectId(params.id),
          this.pageMetricsModel,
          this.calldriversModel,
          this.feedbackModel,
          this.pageModel,
          params.comparisonDateRange,
          taskUrls,
          taskTpcId,
        )),
        visits: visitsComparison,
        dyfYes: dyfYesComparison,
        dyfNo: dyfNoComparison,
      },
      ...omit(
        ['dyfYes', 'dyfNo', 'dyfNoComparison', 'dyfYesComparison'],
        aggregatedMetrics || {},
      ),
      taskSuccessByUxTest: [],
      avgTaskSuccessFromLastTest: null, // todo: better handle N/A
      avgSuccessPercentChange: null,
      avgSuccessValueChange: null,
      dateFromLastTest: null,
      searchTerms: await this.getTopSearchTerms(params),
      feedbackByPage,
      feedbackByDay,
      mostRelevantCommentsAndWords,
      numComments,
      numCommentsPercentChange,
      tpc_id: '',
      enquiry_line: ''
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

      returnData.avgSuccessValueChange = returnData.avgSuccessPercentChange;
      returnData.avgSuccessValueChange = returnData.avgSuccessPercentChange;

      returnData.avgSuccessPercentChange = percentChange(
        returnData.avgTaskSuccessFromLastTest,
        returnData.avgTaskSuccessFromLastTest -
          returnData.avgSuccessPercentChange,
      );
    }

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
): Promise<Omit<TaskDetailsMetrics, 'dyfYes' | 'dyfNo' | 'visits'>> {
  const [startDate, endDate] = dateRangeSplit(dateRange);

  const dateQuery: FilterQuery<Date> = {
    $gte: startDate,
    $lte: endDate,
  };

  const calldriversEnquiry = await calldriversModel.getCallsByEnquiryLine(
    dateRange,
    { tasks: taskId },
  );

  const callsByTopic = await calldriversModel.getCallsByTopic(dateRange, {
    tasks: taskId,
  });

  const totalCalldrivers = calldriversEnquiry.reduce((a, b) => a + b.calls, 0);

  const metricsByDay = await pageMetricsModel
    .aggregate()
    .project({
      date: 1,
      visits: 1,
      dyf_no: 1,
      tasks: 1,
    })
    .match({ date: dateQuery, tasks: taskId })
    .group({
      _id: '$date',
      visits: { $sum: '$visits' },
      dyf_no: { $sum: '$dyf_no' },
    })
    .project({
      _id: 0,
      date: '$_id',
      visits: 1,
      dyfNo: '$dyf_no',
      dyfNoPerVisits: {
        $cond: [
          // todo: this needs to covert all nullish cases
          { $eq: ['$visits', 0] },
          NaN,
          { $divide: ['$dyf_no', '$visits'] },
        ],
      },
    })
    .sort({ date: 1 })
    .exec();

  const visitsByDay = metricsByDay.map(({ date, visits, dyfNo }) => ({
    date,
    visits,
    dyfNo,
  }));

  const dyfNoPerVisits = metricsByDay.map(({ date, dyfNoPerVisits }) => ({
    date,
    value: dyfNoPerVisits,
  }));

  const calldriversByDay = await calldriversModel
    // date actually isn't a string here, but it gets serialized to a string over http
    .aggregate<{ date: string; calls: number }>()
    .project({
      date: 1,
      calls: 1,
      tpc_id: 1,
    })
    .match({
      date: dateQuery,
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
    calldriversEnquiry,
    callsByTopic,
    totalCalldrivers,
    visitsByDay,
    dyfNoPerVisits,
    calldriversByDay,
  };
}
