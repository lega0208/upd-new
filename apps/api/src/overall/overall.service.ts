import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { FilterQuery, Model } from 'mongoose';
import {
  DbService,
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
  Annotations,
  AnnotationsDocument,
} from '@dua-upd/db';
import type {
  ApiParams,
  ProjectsHomeData,
  OverviewAggregatedData,
  OverviewData,
  OverviewUxData,
  OverviewProjectData,
  ProjectsHomeProject,
  OverviewProject,
} from '@dua-upd/types-common';
import {
  arrayToDictionary,
  AsyncLogTiming,
  dateRangeSplit,
  getLatestTestData,
  logJson,
} from '@dua-upd/utils-common';
import { OverallSearchTerm } from '@dua-upd/types-common';

dayjs.extend(utc);
dayjs.extend(quarterOfYear);

const projectStatusSwitchExpression = {
  $switch: {
    branches: [
      {
        case: {
          $and: [
            { $gt: [{ $size: "$statuses" }, 0] },
            {
              $allElementsTrue: {
                $map: {
                  input: '$statuses',
                  as: 'status',
                  in: { $eq: ['$$status', 'Complete'] }
                }
              }
            }
          ]
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
    private db: DbService,
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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(Annotations.name, 'defaultConnection')
    private annotationsModel: Model<AnnotationsDocument>
  ) {}

  @AsyncLogTiming
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

    const satDateStart = await this.searchAssessmentModel
      .findOne()
      .sort({ date: -1 })
      .exec();

    const satDateRange = `${dayjs
      .utc(satDateStart?.date)
      .startOf('day')
      .format('YYYY-MM-DD')}/${dayjs
      .utc(satDateStart?.date)
      .endOf('week')
      .format('YYYY-MM-DD')}`;
    const satComparisonDateRange = `${dayjs
      .utc(satDateStart?.date)
      .subtract(1, 'weeks')
      .startOf('week')
      .format('YYYY-MM-DD')}/${dayjs
      .utc(satDateStart?.date)
      .subtract(1, 'weeks')
      .endOf('week')
      .format('YYYY-MM-DD')}`;

    const results = {
      dateRange: params.dateRange,
      comparisonDateRange: params.comparisonDateRange,
      satDateRange,
      satComparisonDateRange,
      dateRangeData: await getOverviewMetrics(
        this.overallModel,
        this.pageMetricsModel,
        this.calldriversModel,
        this.feedbackModel,
        this.pageModel,
        this.annotationsModel,
        this.db,
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
        this.annotationsModel,
        this.db,
        this.searchAssessmentModel,
        this.cacheManager,
        params.comparisonDateRange,
        satComparisonDateRange
      ),
      projects: await getProjects(this.projectModel, this.uxTestModel),
      uxTests:
        (await this.uxTestModel.find({}, { _id: 0 }).lean().exec()) || [],
      ...(await getUxData(testsSince2018)),
      top5CalldriverTopics,
      top5IncreasedCalldriverTopics,
      top5DecreasedCalldriverTopics,
      searchTermsEn: await this.getTopSearchTerms(params, 'en'),
      searchTermsFr: await this.getTopSearchTerms(params, 'fr'),
    };

    await this.cacheManager.set(cacheKey, results);

    return results;
  }

  async getTopSearchTerms(
    { dateRange, comparisonDateRange }: ApiParams,
    lang: 'en' | 'fr'
  ) {
    const [startDate, endDate] = dateRangeSplit(dateRange);
    const [prevStartDate, prevEndDate] = dateRangeSplit(comparisonDateRange);

    const searchTermsPropName = `aa_searchterms_${lang}`;

    const results =
      (await this.overallModel
        .aggregate<OverallSearchTerm>()
        .project({ date: 1, [searchTermsPropName]: 1 })
        .match({
          date: { $gte: startDate, $lte: endDate },
        })
        .unwind(`$${searchTermsPropName}`)
        .addFields({
          [`${searchTermsPropName}.term`]: {
            $toLower: `$${searchTermsPropName}.term`,
          },
        })
        .group({
          _id: `$${searchTermsPropName}.term`,
          total_searches: {
            $sum: `$${searchTermsPropName}.num_searches`,
          },
          clicks: {
            $sum: `$${searchTermsPropName}.clicks`,
          },
          position: {
            $avg: `$${searchTermsPropName}.position`,
          },
        })
        .sort({ total_searches: -1 })
        .limit(50)
        .project({
          _id: 0,
          term: '$_id',
          total_searches: 1,
          clicks: 1,
          ctr: {
            $cond: {
              if: { $eq: ['$total_searches', 0] },
              then: 0,
              else: {
                $round: [{ $divide: ['$clicks', '$total_searches'] }, 2],
              },
            },
          },
          position: {
            $round: ['$position', 2],
          },
        })
        .exec()) || [];

    const prevResults =
      (await this.overallModel
        .aggregate<Pick<OverallSearchTerm, 'term' | 'total_searches'>>()
        .project({ date: 1, [searchTermsPropName]: 1 })
        .match({
          date: { $gte: prevStartDate, $lte: prevEndDate },
        })
        .unwind(`$${searchTermsPropName}`)
        .addFields({
          [`${searchTermsPropName}.term`]: {
            $toLower: `$${searchTermsPropName}.term`,
          },
        })
        .match({
          [`${searchTermsPropName}.term`]: {
            $in: results.map(({ term }) => term),
          },
        })
        .group({
          _id: `$${searchTermsPropName}.term`,
          total_searches: {
            $sum: `$${searchTermsPropName}.num_searches`,
          },
        })
        .project({
          _id: 0,
          term: '$_id',
          total_searches: 1,
        })
        .exec()) || [];

    const prevResultsDict = arrayToDictionary(prevResults, 'term');

    return results.map((result) => {
      const prevSearches = prevResultsDict[result.term]?.total_searches;
      const searchesChange =
        typeof prevSearches === 'number' && prevSearches !== 0
          ? Math.round(
              ((result.total_searches - prevSearches) / prevSearches) * 100
            ) / 100
          : null;

      return {
        ...result,
        prevSearches,
        searchesChange,
      };
    });
  }
}

async function getProjects(
  projectModel: Model<ProjectDocument>,
  uxTestsModel: Model<UxTestDocument>
): Promise<OverviewProjectData> {
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
    .aggregate<OverviewProject>()
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
            uxTests: {
              $push: {
                success_rate: '$success_rate',
                date: '$date',
                test_type: '$test_type',
              },
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
      uxTests: 1,
    });

  const avgUxTest: {
    percentChange: number;
    avgTestSuccess: number;
    total: number;
  }[] = [];

  for (const data of projectsData) {
    const { percentChange, avgTestSuccess, total } = getLatestTestData(
      data.uxTests
    );

    data.lastAvgSuccessRate = avgTestSuccess;

    if (avgTestSuccess !== null) {
      avgUxTest.push({ percentChange, avgTestSuccess, total });
    }
  }

  // UX Tests KPI updates - Latest average success rate for UX tests with Validation only
  const kpiUxTestsSuccessRates = projectsData
    .flatMap((project) => project.uxTests)
    .filter((test) => test.test_type === 'Validation' && test.success_rate)
    .map((test) => test.success_rate);

  const testsCompleted = kpiUxTestsSuccessRates.length;

  const avgTestSuccessAvg =
    kpiUxTestsSuccessRates.reduce((acc, success) => acc + success, 0) /
    testsCompleted;

  return {
    ...aggregatedData,
    ...uxTest,
    projects: projectsData,
    avgUxTest,
    avgTestSuccessAvg,
    testsCompleted,
  };
}

async function getOverviewMetrics(
  overallModel: Model<OverallDocument>,
  PageMetricsModel: PageMetricsModel,
  calldriversModel: CallDriverModel,
  feedbackModel: Model<FeedbackDocument>,
  pageModel: Model<PageDocument>,
  annotationsModel: Model<AnnotationsDocument>,
  db: DbService,
  searchAssessmentModel: Model<SearchAssessmentDocument>,
  cacheManager: Cache,
  dateRange: string,
  satDateRange: string
): Promise<OverviewAggregatedData> {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const dateQuery: FilterQuery<Date> = {};

  dateQuery.$gte = new Date(startDate);
  dateQuery.$lte = new Date(endDate);

  const [satStartDate, satEndDate] = satDateRange
    .split('/')
    .map((d) => new Date(d));

  const satDateQuery: FilterQuery<Date> = {};

  satDateQuery.$gte = new Date(satStartDate);
  satDateQuery.$lte = new Date(satEndDate);

  const annotations = (
    await annotationsModel.find({ event_date: dateQuery }).lean().exec()
  ).map((item) => ({
    ...item,
    event_date: item.event_date.toISOString(),
  }));

  const visitsByDay = (
    await overallModel
      .find({ date: dateQuery }, { _id: 0, date: 1, visits: 1 })
      .sort({ date: 1 })
      .lean()
      .exec()
  ).map((visits) => ({
    ...visits,
    date: visits.date.toISOString(),
  }));

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
    .project({
      date: 1,
      enquiry_line: 1,
      calls: 1,
    })
    .match({ date: dateQuery })
    .group({
      _id: '$enquiry_line',
      sum: { $sum: '$calls' },
    })
    .sort({ sum: -1 })
    .project({
      _id: 0,
      enquiry_line: '$_id',
      sum: 1,
    })
    .exec();

  const [start, end] = dateRangeSplit(dateRange);

  const topPagesVisited = (
    await db.views.pageVisits.getVisitsWithPageData({ start, end }, pageModel)
  ).slice(0, 10);

  const top10GSC = await overallModel
    .aggregate()
    .project({ date: 1, gsc_searchterms: 1 })
    .sort({ date: 1 })
    .match({ date: dateQuery })
    .unwind('$gsc_searchterms')
    .group({
      _id: '$gsc_searchterms.term',
      clicks: { $sum: '$gsc_searchterms.clicks' },
      impressions: { $sum: '$gsc_searchterms.impressions' },
      ctr: { $avg: '$gsc_searchterms.ctr' },
      position: { $avg: '$gsc_searchterms.position' },
    })
    .sort({ clicks: -1 })
    .limit(10)
    .exec();

  const totalFeedback = await feedbackModel
    .aggregate()
    .project({
      date: 1,
      url: 1,
      main_section: 1,
    })
    .sort({ date: 1 })
    .match({
      $and: [
        {
          date: dateQuery,
        },
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
    })
    .sort({ sum: -1 })
    .project({
      _id: 0,
      main_section: '$_id',
      sum: 1,
    })
    .exec();

  const feedbackPages = await feedbackModel
    .aggregate<{ _id: string; title: string; url: string; sum: number }>()
    .project({
      date: 1,
      url: 1,
    })
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
    .aggregate<{
      visitors: number;
      visits: number;
      pageViews: number;
      impressions: number;
      ctr: number;
      position: number;
      dyf_yes: number;
      dyf_no: number;
      dyf_submit: number;
      fwylf_error: number;
      fwylf_hard_to_understand: number;
      fwylf_other: number;
      fwylf_cant_find_info: number;
    }>()
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

  // get search assessment data, but don't merge query if there is value in en or fr

  const searchAssessmentData = await searchAssessmentModel
    .aggregate()
    .match({ date: satDateQuery })
    // don't group by query if there is a value in en or fr
    .group({
      _id: {
        query: '$query',
        lang: '$lang',
      },
      total_clicks: { $sum: '$total_clicks' },
      target_clicks: { $sum: '$target_clicks' },
      total_searches: { $sum: '$total_searches' },
      expected_position: { $avg: '$expected_position' },
      position: { $avg: '$expected_position' },
      doc: { $push: '$$ROOT' },
    })
    .replaceRoot({
      $mergeObjects: [{ $first: '$doc' }, '$$ROOT'],
    })
    .project({
      query: '$_id.query',
      lang: '$_id.lang',
      _id: 0,
      total_clicks: 1,
      target_clicks: 1,
      total_searches: 1,
      position: 1,
      expected_result: 1,
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
    annotations,
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
