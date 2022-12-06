import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { FilterQuery, Model } from 'mongoose';
import {
  CallDriver,
  CallDriverModel,
  Overall,
  OverallDocument,
  Project,
  ProjectDocument,
  Task,
  TaskDocument,
  UxTest,
  UxTestDocument,
  Feedback,
  FeedbackDocument,
  PageMetrics,
  PageMetricsModel,
  Page,
  PageDocument,
  SearchAssessment,
  SearchAssessmentDocument,
} from '@dua-upd/db';
import type {
  ProjectsHomeData,
  OverviewAggregatedData,
  OverviewData,
  OverviewUxData,
  OverviewProjectData,
} from '@dua-upd/types-common';
import { ApiParams } from '@dua-upd/upd/services';

dayjs.extend(utc);
dayjs.extend(quarterOfYear);

const projectStatusSwitchExpression = {
  $switch: {
    branches: [
      {
        case: {
          $allElementsTrue: {
            $map: {
              input: '$statuses',
              as: 'status',
              in: { $eq: ['$$status', 'Complete'] },
            },
          },
        },
        then: 'Complete',
      },
      {
        case: {
          $in: ['Delayed', '$statuses'],
        },
        then: 'Delayed',
      },
      {
        case: {
          $in: ['In Progress', '$statuses'],
        },
        then: 'In Progress',
      },
      {
        case: {
          $in: ['Planning', '$statuses'],
        },
        then: 'Planning',
      },
    ],
    default: 'Unknown',
  },
};

@Injectable()
export class OverallService {
  constructor(
    @InjectModel(Overall.name, 'defaultConnection')
    private overallModel: Model<OverallDocument>,
    @InjectModel(Page.name, 'defaultConnection')
    private pageModel: Model<PageDocument>,
    @InjectModel(PageMetrics.name, 'defaultConnection')
    private pageMetricsModel: PageMetricsModel,
    @InjectModel(Project.name, 'defaultConnection')
    private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name, 'defaultConnection')
    private taskModel: Model<TaskDocument>,
    @InjectModel(UxTest.name, 'defaultConnection')
    private uxTestModel: Model<UxTestDocument>,
    @InjectModel(CallDriver.name, 'defaultConnection')
    private calldriversModel: CallDriverModel,
    @InjectModel(Feedback.name, 'defaultConnection')
    private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(SearchAssessment.name, 'defaultConnection')
    private searchAssessmentModel: Model<SearchAssessmentDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  // todo: precache everything on startup
  async getMetrics(params: ApiParams): Promise<OverviewData> {
    const cacheKey = `OverviewMetrics-${params.dateRange}`;
    const cachedData = await this.cacheManager.store.get<OverviewData>(
      cacheKey
    );

    if (cachedData) {
      return cachedData;
    }

    const testsSince2018 = await this.uxTestModel.find({
      date: { $gte: new Date('2018-01-01') },
    });

    const topCalldriverTopics =
      await this.calldriversModel.getTopicsWithPercentChange(
        params.dateRange,
        params.comparisonDateRange
      );

    const top5CalldriverTopics = topCalldriverTopics.slice(0, 5);

    const top5IncreasedCalldriverTopics = topCalldriverTopics
      .sort((a, b) => Number(b.change) - Number(a.change))
      .slice(0, 5);

    const top5DecreasedCalldriverTopics = topCalldriverTopics
      .filter((topic) => topic.change < 0)
      .sort((a, b) => Number(a.change) - Number(b.change))
      .slice(0, 5);

    
    const satDateRange = `${dayjs.utc().subtract(2, 'weeks').startOf('week').format('YYYY-MM-DD')}/${dayjs.utc().subtract(2, 'weeks').endOf('week').format('YYYY-MM-DD')}`;
    const satComparisonDateRange = `${dayjs.utc().subtract(3, 'weeks').startOf('week').format('YYYY-MM-DD')}/${dayjs.utc().subtract(3, 'weeks').endOf('week').format('YYYY-MM-DD')}`;
    const results = {
      dateRange: params.dateRange,
      comparisonDateRange: params.comparisonDateRange,
      dateRangeData: await getOverviewMetrics(
        this.overallModel,
        this.pageMetricsModel,
        this.calldriversModel,
        this.feedbackModel,
        this.pageModel,
        this.searchAssessmentModel,
        this.cacheManager,
        params.dateRange,
        satDateRange
      ),
      comparisonDateRangeData: await getOverviewMetrics(
        this.overallModel,
        this.pageMetricsModel,
        this.calldriversModel,
        this.feedbackModel,
        this.pageModel,
        this.searchAssessmentModel,
        this.cacheManager,
        params.comparisonDateRange,
        satComparisonDateRange
      ),
      projects: await getProjects(this.projectModel, this.uxTestModel),
      ...(await getUxData(testsSince2018)),
      top5CalldriverTopics,
      top5IncreasedCalldriverTopics,
      top5DecreasedCalldriverTopics,
    } as OverviewData;

    await this.cacheManager.set(cacheKey, results);

    return results;
  }
}

async function getProjects(
  projectModel: Model<ProjectDocument>,
  uxTestsModel: Model<UxTestDocument>
): Promise<ProjectsHomeData> {
  const defaultData = {
    numInProgress: 0,
    numCompletedLast6Months: 0,
    totalCompleted: 0,
    numDelayed: 0,
  };

  const sixMonthsAgo = dayjs().utc(false).subtract(6, 'months').toDate();
  const year2018 = dayjs('2018-01-01').utc(false).toDate();

  const uxTest =
    (
      await uxTestsModel
        .aggregate()
        .group({
          _id: '$cops',
          count: { $sum: 1 },
          countLast6Months: {
            $sum: {
              $cond: [{ $gte: ['$date', sixMonthsAgo] }, 1, 0],
            },
          },
          countSince2018: {
            $sum: {
              $cond: [{ $gte: ['$date', year2018] }, 1, 0],
            },
          },
        })
        .group({
          _id: null,
          numInProgress: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'In Progress'] }, '$count', 0],
            },
          },
          completedLast6Months: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'Complete'] }, '$countLast6Months', 0],
            },
          },
          completedSince2018: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'Complete'] }, '$countSince2018', 0],
            },
          },
          copsCompletedSince2018: {
            $sum: {
              $cond: [{ $eq: ['$_id', true] }, '$countSince2018', 0],
            },
          },
          totalCompleted: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'Complete'] }, '$count', 0],
            },
          },
          numDelayed: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'Delayed'] }, '$count', 0],
            },
          },
        })
        .project({
          _id: 0,
          copsCompletedSince2018: 1,
        })
        .exec()
    )[0] || defaultData;

  const aggregatedData =
    (
      await uxTestsModel
        .aggregate<Omit<ProjectsHomeData, 'projects'>>()
        .group({
          _id: '$project',
          statuses: {
            $addToSet: '$status',
          },
          date: { $min: '$date' },
        })
        .project({
          last6Months: {
            $gte: ['$date', sixMonthsAgo],
          },
          since2018: {
            $gte: ['$date', year2018],
          },
          status: projectStatusSwitchExpression,
        })
        .sort({ status: 1 })
        .group({
          _id: '$status',
          count: { $sum: 1 },
          countLast6Months: {
            $sum: {
              $cond: [{ $gte: ['$date', sixMonthsAgo] }, 1, 0],
            },
          },
          countSince2018: {
            $sum: {
              $cond: [{ $gte: ['$date', year2018] }, 1, 0],
            },
          },
        })
        .group({
          _id: null,
          numInProgress: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'In Progress'] }, '$count', 0],
            },
          },
          completedLast6Months: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'Complete'] }, '$countLast6Months', 0],
            },
          },
          completedSince2018: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'Complete'] }, '$countSince2018', 0],
            },
          },
          totalCompleted: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'Complete'] }, '$count', 0],
            },
          },
          numDelayed: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'Delayed'] }, '$count', 0],
            },
          },
        })
        .project({
          _id: 0,
          numInProgress: 1,
          completedSince2018: 1,
          numCompletedLast6Months: 1,
          totalCompleted: 1,
          numDelayed: 1,
        })
        .exec()
    )[0] || defaultData;

  const projectsData = await projectModel
    .aggregate<OverviewProjectData>()
    .lookup({
      from: 'ux_tests',
      let: { project_id: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$project', '$$project_id'],
            },
          },
        },
        {
          $group: {
            _id: null,
            cops: {
              $max: '$cops',
            },
            startDate: {
              $min: '$date',
            },
            launchDate: {
              $max: '$launch_date',
            },
            avgSuccessRate: {
              $avg: '$success_rate',
            },
            statuses: {
              $addToSet: '$status',
            },
            totalUsers: {
              $sum: '$total_users',
            },
            testType: {
              $addToSet: '$test_type',
            },
          },
        },
        {
          $addFields: {
            status: projectStatusSwitchExpression,
          },
        },
      ],
      as: 'tests_aggregated',
    })
    .unwind('$tests_aggregated')
    .replaceRoot({
      $mergeObjects: ['$$ROOT', '$tests_aggregated', { _id: '$_id' }],
    })
    .project({
      title: 1,
      cops: 1,
      startDate: 1,
      launchDate: 1,
      avgSuccessRate: 1,
      status: 1,
      totalUsers: 1,
      testType: 1,
    });

  const uxTests = await uxTestsModel
    .aggregate<UxTestDocument>()
    .project({
      _id: 0,
    })
    .exec();

  const results = {
    ...aggregatedData,
    ...uxTest,
    projects: projectsData,
    uxTests: uxTests,
  };

  return results;
}

async function getOverviewMetrics(
  overallModel: Model<OverallDocument>,
  PageMetricsModel: PageMetricsModel,
  calldriversModel: CallDriverModel,
  feedbackModel: Model<FeedbackDocument>,
  pageModel: Model<PageDocument>,
  searchAssessmentModel: Model<SearchAssessmentDocument>,
  cacheManager: Cache,
  dateRange: string,
  satDateRange: string
): Promise<OverviewAggregatedData> {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const dateQuery: FilterQuery<Date> = {};

  dateQuery.$gte = new Date(startDate);
  dateQuery.$lte = new Date(endDate);

  const [satStartDate, satEndDate] = satDateRange.split('/').map((d) => new Date(d));

  const satDateQuery: FilterQuery<Date> = {};

  satDateQuery.$gte = new Date(satStartDate);
  satDateQuery.$lte = new Date(satEndDate);

  const visitsByDay = await overallModel
    .find({ date: dateQuery }, { _id: 0, date: 1, visits: 1 })
    .sort({ date: 1 })
    .lean();

  const dyfByDay = await overallModel
    .find(
      { date: dateQuery },
      { _id: 0, date: 1, dyf_yes: 1, dyf_no: 1, dyf_submit: 1 }
    )
    .sort({ date: 1 })
    .lean();

  const calldriversByDay = await calldriversModel
    .aggregate()
    .match({ date: dateQuery })
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

  const calldriversEnquiry = await calldriversModel
    .aggregate()
    .match({ date: dateQuery })
    .group({
      _id: '$enquiry_line',
      sum: { $sum: '$calls' },
      doc: { $push: '$$ROOT' },
    })
    .replaceRoot({
      $mergeObjects: [{ $first: '$doc' }, '$$ROOT'],
    })
    .sort({ enquiry_line: 'asc' })
    .project({
      _id: 0,
      doc: 0,
      airtable_id: 0,
      date: 0,
      calls: 0,
      tpc_id: 0,
      topic: 0,
      subtopic: 0,
      sub_subtopic: 0,
      impact: 0,
      __v: 0,
    })
    .exec();

  const topPagesVisited = await PageMetricsModel.aggregate()
    .sort({ date: 1, url: 1 })
    .match({ date: dateQuery })
    .group({ _id: '$url', visits: { $sum: '$visits' } })
    .sort({ visits: -1 })
    .limit(10)
    .exec();

  const top10GSC = await overallModel
    .aggregate()
    .sort({ date: 1 })
    .match({ date: dateQuery })
    .unwind('$gsc_searchterms')
    .project({
      term: '$gsc_searchterms.term',
      clicks: '$gsc_searchterms.clicks',
      impressions: '$gsc_searchterms.impressions',
      ctr: '$gsc_searchterms.ctr',
      position: '$gsc_searchterms.position',
    })
    .sort({ term: 1 })
    .group({
      _id: '$term',
      clicks: { $sum: '$clicks' },
      impressions: { $sum: '$impressions' },
      ctr: { $avg: '$ctr' },
      position: { $avg: '$position' },
    })
    .sort({ clicks: -1 })
    .limit(10)
    .exec();

  const totalFeedback = await feedbackModel
    .aggregate()
    .sort({ date: 1 })
    .match({
      $and: [
        { date: dateQuery },
        {
          url: {
            $regex:
              '/en/revenue-agency|/fr/agence-revenu|/en/services/taxes|/fr/services/impots',
          },
        },
      ],
    })
    .group({
      _id: '$main_section',
      sum: { $sum: 1 },
      doc: { $push: '$$ROOT' },
    })
    .replaceRoot({
      $mergeObjects: [{ $first: '$doc' }, '$$ROOT'],
    })
    .sort({ main_section: 'asc' })
    .project({
      _id: 0,
      doc: 0,
      airtable_id: 0,
      date: 0,
      whats_wrong: 0,
      tags: 0,
      status: 0,
      theme: 0,
      url: 0,
      __v: 0,
    })
    .exec();

  const feedbackPages = await feedbackModel
    .aggregate<{ _id: string; title: string; url: string; sum: number }>()
    .match({
      $and: [
        { date: dateQuery },
        // todo: remove url filter once there is logic in place to remove non-CRA pages from feedback collection
        {
          url: {
            $regex:
              '/en/revenue-agency|/fr/agence-revenu|/en/services/taxes|/fr/services/impots',
          },
        },
      ],
    })
    .group({
      _id: '$url',
      sum: { $sum: 1 },
    })
    .project({
      _id: 0,
      url: '$_id',
      sum: 1,
    })
    .sort({ sum: -1 })
    .lookup({
      from: 'pages',
      localField: 'url',
      foreignField: 'url',
      as: 'page',
    })
    .unwind('$page')
    .addFields({
      _id: '$page._id',
      title: '$page.title',
    })
    .project({
      page: 0,
    })
    .exec();

  const aggregatedMetrics = await overallModel
    .aggregate<
      Omit<
        OverviewAggregatedData,
        'visitsByDay' | 'calldriversByDay' | 'dyfByDay'
      >
    >()
    .match({
      date: dateQuery,
    })
    .project({
      visitors: 1,
      visits: 1,
      views: 1,
      gsc_total_impressions: 1,
      gsc_total_ctr: 1,
      gsc_total_position: 1,
      dyf_yes: 1,
      dyf_no: 1,
      dyf_submit: 1,
      fwylf_error: 1,
      fwylf_hard_to_understand: 1,
      fwylf_other: 1,
      fwylf_cant_find_info: 1,
    })
    .group({
      _id: null,
      visitors: { $sum: '$visitors' },
      visits: { $sum: '$visits' },
      pageViews: { $sum: '$views' },
      impressions: { $sum: '$gsc_total_impressions' },
      ctr: { $avg: '$gsc_total_ctr' },
      position: { $avg: '$gsc_total_position' },
      dyf_yes: { $sum: '$dyf_yes' },
      dyf_no: { $sum: '$dyf_no' },
      dyf_submit: { $sum: '$dyf_submit' },
      fwylf_error: { $sum: '$fwylf_error' },
      fwylf_hard_to_understand: { $sum: '$fwylf_hard_to_understand' },
      fwylf_other: { $sum: '$fwylf_other' },
      fwylf_cant_find_info: { $sum: '$fwylf_cant_find_info' },
    })
    .project({ _id: 0 })
    .exec();

  
  const searchAssessmentData = await searchAssessmentModel
    .aggregate()
    .match({ date: satDateQuery })
    .group({
      _id: { $toLower: '$query' },
      clicks: { $sum: '$clicks' },
      position: { $avg: '$expected_position' },
      doc: { $push: '$$ROOT' },
    })
    .replaceRoot({
      $mergeObjects: [{ $first: '$doc' }, '$$ROOT'],
    })
    .project({
      query: '$_id',
      _id: 0,
      clicks: 1,
      position: 1,
      expected_result: 1,
      lang: 1,
    })
    .exec();

  return {
    visitsByDay,
    calldriversByDay,
    dyfByDay,
    calldriversEnquiry,
    searchAssessmentData,
    ...aggregatedMetrics[0],
    totalFeedback,
    topPagesVisited,
    top10GSC,
    feedbackPages,
  };
}

async function getUxData(uxTests: UxTest[]): Promise<OverviewUxData> {
  const testsCompleted = uxTests.filter((test) => test.status === 'Complete');

  const testsCompletedSince2018 = testsCompleted.length;

  const copsTestsCompletedSince2018 = testsCompleted.filter(
    (test) => test.cops
  ).length;

  const tasksTestedSince2018 = testsCompleted
    .filter((test) => test.tasks?.length > 0)
    .map((test) => test.tasks)
    .flat();
  const numUniqueTasksTestedSince2018 = new Set(tasksTestedSince2018).size;

  const participantsTestedSince2018 = testsCompleted.reduce(
    (total, test) => total + (test.total_users || 0),
    0
  );

  // todo: make dynamic
  const lastFiscal = {
    start: new Date('2021-04-01'),
    end: new Date('2022-03-31'),
  };
  const testsConductedLastFiscal = testsCompleted.filter(
    (test) => test.date >= lastFiscal.start && test.date <= lastFiscal.end
  ).length;

  const lastQuarterStart = dayjs
    .utc()
    .subtract(1, 'quarter')
    .startOf('quarter');
  const lastQuarterEnd = lastQuarterStart.endOf('quarter');

  const testsConductedLastQuarter = testsCompleted.filter(
    (test) =>
      test.date >= lastQuarterStart.toDate() &&
      test.date <= lastQuarterEnd.toDate()
  ).length;

  return {
    testsCompletedSince2018,
    tasksTestedSince2018: numUniqueTasksTestedSince2018,
    participantsTestedSince2018,
    testsConductedLastFiscal,
    testsConductedLastQuarter,
    copsTestsCompletedSince2018,
  };
}
