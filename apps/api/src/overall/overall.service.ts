import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import type { FilterQuery, Model } from 'mongoose';
import type {
  CallDriverModel,
  OverallDocument,
  ProjectDocument,
  TaskDocument,
  UxTestDocument,
  PageMetricsModel,
  PageDocument,
  SearchAssessmentDocument,
  AnnotationsDocument,
  GcTasksDocument,
  FeedbackModel,
} from '@dua-upd/db';
import {
  DbService,
  CallDriver,
  Overall,
  Project,
  Task,
  UxTest,
  Feedback,
  PageMetrics,
  Page,
  SearchAssessment,
  Annotations,
  GcTasks,
} from '@dua-upd/db';
import type {
  ApiParams,
  ProjectsHomeData,
  OverviewAggregatedData,
  OverviewData,
  OverviewUxData,
  OverviewProjectData,
  OverviewProject,
  OverallSearchTerm,
} from '@dua-upd/types-common';
import {
  arrayToDictionary,
  AsyncLogTiming,
  avg,
  dateRangeSplit,
  getImprovedKpiSuccessRates,
  getLatestTestData,
  parseDateRangeString,
  percentChange,
} from '@dua-upd/utils-common';
import { FeedbackService } from '@dua-upd/api/feedback';

dayjs.extend(utc);
dayjs.extend(quarterOfYear);

const projectStatusSwitchExpression = {
  $switch: {
    branches: [
      {
        case: {
          $and: [
            { $gt: [{ $size: '$statuses' }, 0] },
            {
              $allElementsTrue: {
                $map: {
                  input: '$statuses',
                  as: 'status',
                  in: { $eq: ['$$status', 'Complete'] },
                },
              },
            },
          ],
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
    private feedbackModel: FeedbackModel,
    @InjectModel(SearchAssessment.name, 'defaultConnection')
    private searchAssessmentModel: Model<SearchAssessmentDocument>,
    @InjectModel(GcTasks.name, 'defaultConnection')
    private gcTasksModel: Model<GcTasksDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(Annotations.name, 'defaultConnection')
    private annotationsModel: Model<AnnotationsDocument>,
    private feedbackService: FeedbackService,
  ) {}

  @AsyncLogTiming
  async getMetrics(params: ApiParams): Promise<OverviewData> {
    const cacheKey = `OverviewMetrics-${params.dateRange}-${params['ipd']}`;

    const cachedData =
      await this.cacheManager.store.get<OverviewData>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const testsSince2018 = await this.uxTestModel.find({
      date: { $gte: new Date('2018-01-01') },
    });

    const calldriverTopics = (
      await this.calldriversModel.getTopicsWithPercentChange(
        params.dateRange,
        params.comparisonDateRange,
      )
    ).sort((a, b) => b.calls - a.calls);

    const top5IncreasedCalldriverTopics = calldriverTopics
      .filter((topic) => topic.change)
      .sort((a, b) => Number(b.change) - Number(a.change))
      .slice(0, 5);

    const top5DecreasedCalldriverTopics = calldriverTopics
      .filter((topic) => Number(topic.change) < 0)
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

    const uxTests =
      (await this.uxTestModel.find({}, { _id: 0 }).lean().exec()) || [];

    const improvedTasksKpi = getImprovedKpiSuccessRates(uxTests);

    const mostRelevantCommentsAndWords =
      await this.feedbackService.getMostRelevantCommentsAndWords({
        dateRange: parseDateRangeString(params.dateRange),
        ipd: params.ipd as boolean,
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

    const numCommentsPercentChange = !params.ipd && numPreviousComments
      ? percentChange(numComments, numPreviousComments)
      : null;

    const commentsByPage = await this.feedbackModel.getCommentsByPageWithComparison(
      params.dateRange,
      params.comparisonDateRange
    );

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
        this.gcTasksModel,
        this.cacheManager,
        params.dateRange,
        satDateRange,
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
        this.gcTasksModel,
        this.cacheManager,
        params.comparisonDateRange,
        satComparisonDateRange,
      ),
      projects: await getProjects(this.projectModel, this.uxTestModel),
      uxTests,
      improvedTasksKpi: getImprovedKpiSuccessRates(uxTests),
      ...(await getUxData(testsSince2018)),
      calldriverTopics,
      top5IncreasedCalldriverTopics,
      top5DecreasedCalldriverTopics,
      searchTermsEn: await this.getTopSearchTerms(params, 'en'),
      searchTermsFr: await this.getTopSearchTerms(params, 'fr'),
      mostRelevantCommentsAndWords,
      numComments,
      numCommentsPercentChange,
      commentsByPage,
    };

    await this.cacheManager.set(cacheKey, results);

    return results;
  }

  async getTopSearchTerms(
    { dateRange, comparisonDateRange }: ApiParams,
    lang: 'en' | 'fr',
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
              ((result.total_searches - prevSearches) / prevSearches) * 100,
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
  uxTestsModel: Model<UxTestDocument>,
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
                task: '$tasks',
                title: '$title',
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
    })
    .exec();

  const avgUxTest: {
    percentChange: number;
    avgTestSuccess: number;
    total: number;
  }[] = [];

  for (const data of projectsData) {
    const { percentChange, avgTestSuccess, total } = getLatestTestData(
      data.uxTests,
    );

    data.lastAvgSuccessRate = avgTestSuccess;

    if (avgTestSuccess !== null) {
      avgUxTest.push({ percentChange, avgTestSuccess, total });
    }
  }

  const kpiUxTestsSuccessRates = projectsData
    .flatMap((project) => project.uxTests)
    .filter(
      (test) =>
        test.test_type === 'Validation' &&
        (test.success_rate || test.success_rate === 0),
    )
    .map((test) => test.success_rate);

  const avgTestSuccessAvg = avg(kpiUxTestsSuccessRates, 2);

  const kpiUxTestsSuccessRates2 = projectsData
    .flatMap((project) => {
      const testsByType: { [key: string]: any[] } = {}; // Object to store tests by type

      // Iterate through tests of each project and categorize them by type
      project.uxTests.forEach((test) => {
        if (testsByType[test.test_type]) {
          testsByType[test.test_type].push(test);
        } else {
          testsByType[test.test_type] = [test];
        }
      });

      // Filter and return tests based on the criteria
      const filteredTests = [];

      // Include tests from projects tested once by type (Baseline, Spot Check, or Exploratory)
      ['Baseline', 'Spot Check', 'Exploratory'].forEach((type) => {
        if (testsByType[type] && testsByType[type].length === 1) {
          const test = testsByType[type][0];
          const projectAlreadyCounted = filteredTests.some(
            (t) => t.test_type === type,
          );
          if (!projectAlreadyCounted) {
            filteredTests.push(test);
          }
        }
      });

      // Include all validation tests
      Object.values(testsByType).forEach((tests: any[]) => {
        if (tests.length >= 2 && tests[0].test_type === 'Validation') {
          tests.forEach((test) => {
            const projectAlreadyCounted = filteredTests.some(
              (t) => t.test_type === 'Validation',
            );
            if (!projectAlreadyCounted) {
              filteredTests.push(test);
            }
          });
        }
      });

      return filteredTests;
    })
    .filter((test) => test.success_rate || test.success_rate === 0)
    .map((test) => test.success_rate);

  const avgTestSuccess = avg(kpiUxTestsSuccessRates2, 2);

  const taskSuccessRatesRecord: Record<string, number[]> = projectsData
    .flatMap((project) => project.uxTests)
    .filter(
      (test) =>
        test.test_type === 'Validation' &&
        (test.success_rate || test.success_rate === 0) &&
        test.task &&
        test.title,
    )
    .reduce(
      (acc, test) => {
        if (!acc[test.task]) {
          acc[test.task] = [];
        }

        acc[test.task].push(test.success_rate);

        return acc;
      },
      {} as Record<string, number[]>,
    );

  // except this is actually "unique tasks tested?"
  const testsCompleted = Object.values(taskSuccessRatesRecord).length;

  const uniqueTasksTested: Set<string> = new Set();

  projectsData.forEach((project) => {
    const testsByType: { [key: string]: any[] } = {};

    project.uxTests.forEach((test) => {
      if (testsByType[test.test_type]) {
        testsByType[test.test_type].push(test);
      } else {
        testsByType[test.test_type] = [test];
      }
    });

    // Include tests from projects tested once by type (Baseline, Spot Check, or Exploratory)
    ['Baseline', 'Spot Check', 'Exploratory'].forEach((type) => {
      if (testsByType[type] && testsByType[type].length === 1) {
        uniqueTasksTested.add(testsByType[type][0].task);
      }
    });

    // Include all validation tests
    Object.values(testsByType).forEach((tests: any[]) => {
      if (tests.length >= 2 && tests[0].test_type === 'Validation') {
        tests.forEach((test) => {
          uniqueTasksTested.add(test.task);
        });
      }
    });
  });

  const uniqueTaskTestedLatestTestKpi = uniqueTasksTested.size;

  return {
    ...aggregatedData,
    ...uxTest,
    projects: projectsData,
    avgUxTest,
    avgTestSuccessAvg,
    testsCompleted,
    uniqueTaskTestedLatestTestKpi,
    avgTestSuccess,
  };
}

async function getOverviewMetrics(
  overallModel: Model<OverallDocument>,
  PageMetricsModel: PageMetricsModel,
  calldriversModel: CallDriverModel,
  feedbackModel: FeedbackModel,
  pageModel: Model<PageDocument>,
  annotationsModel: Model<AnnotationsDocument>,
  db: DbService,
  searchAssessmentModel: Model<SearchAssessmentDocument>,
  gcTasksModel: Model<GcTasksDocument>,
  cacheManager: Cache,
  dateRange: string,
  satDateRange: string,
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
      { _id: 0, date: 1, dyf_yes: 1, dyf_no: 1, dyf_submit: 1 },
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

    const feedbackByDay = await feedbackModel
    .aggregate<{ date: string; sum: number }>()
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
      _id: '$date',
      sum: { $sum: 1 },
    })
    .project({
      _id: 0,
      date: '$_id',
      sum: 1,
    })
    .sort({ date: 1 })
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

  const gcTasksComments = await gcTasksModel.aggregate().match({
    date: { $gte: start, $lte: end },
    sampling_task: 'y',
    able_to_complete: {
      $ne: 'I started this survey before I finished my visit',
    },
  });

  const gcTasksData = await gcTasksModel
    .aggregate()
    .match({
      date: { $gte: start, $lte: end },
      sampling_task: 'y',
      able_to_complete: {
        $ne: 'I started this survey before I finished my visit',
      },
    })
    .group({
      _id: { gc_task: '$gc_task', theme: '$theme' },
      total_entries: { $sum: 1 },
      satisfaction: {
        $avg: {
          $cond: [
            { $in: ['$satisfaction', ['Very satisfied', 'Satisfied']] },
            1,
            0,
          ],
        },
      },
      ease: {
        $avg: { $cond: [{ $in: ['$ease', ['Very easy', 'Easy']] }, 1, 0] },
      },
      able_to_complete: {
        $avg: { $cond: [{ $eq: ['$able_to_complete', 'Yes'] }, 1, 0] },
      },
    })
    .project({
      gc_task: '$_id.gc_task',
      theme: '$_id.theme',
      total_entries: 1,
      satisfaction: 1,
      ease: 1,
      able_to_complete: 1,
      margin_of_error: {
        $divide: [
          {
            $add: [
              {
                $multiply: [
                  1.96,
                  {
                    $sqrt: {
                      $divide: [
                        {
                          $multiply: [
                            '$satisfaction',
                            { $subtract: [1, '$satisfaction'] },
                          ],
                        },
                        '$total_entries',
                      ],
                    },
                  },
                ],
              },
              {
                $multiply: [
                  1.96,
                  {
                    $sqrt: {
                      $divide: [
                        { $multiply: ['$ease', { $subtract: [1, '$ease'] }] },
                        '$total_entries',
                      ],
                    },
                  },
                ],
              },
              {
                $multiply: [
                  1.96,
                  {
                    $sqrt: {
                      $divide: [
                        {
                          $multiply: [
                            '$able_to_complete',
                            { $subtract: [1, '$able_to_complete'] },
                          ],
                        },
                        '$total_entries',
                      ],
                    },
                  },
                ],
              },
            ],
          },
          3,
        ],
      },
    })
    .sort({ total_entries: -1 })
    .project({ _id: 0 });

  return {
    visitsByDay,
    calldriversByDay,
    dyfByDay,
    calldriversEnquiry,
    searchAssessmentData,
    ...aggregatedMetrics[0],
    topPagesVisited,
    top10GSC,
    annotations,
    gcTasksData,
    gcTasksComments,
    feedbackByDay
  };
}

interface ProjectData {
  testTypes: Set<string>;
  tasks: Set<string>;
  cops: Set<string>;
  lastQuarterTests: Set<string>;
  lastFiscalTests: Set<string>;
}

async function getUxData(uxTests: UxTest[]): Promise<OverviewUxData> {
  const projectData: { [key: string]: ProjectData } = {};
  const datejs = dayjs.utc();
  const lastQuarterStart = datejs.subtract(1, 'quarter').startOf('quarter');
  const lastQuarterEnd = lastQuarterStart.endOf('quarter');
  const currentYearEnd = datejs.month(2).endOf('month').startOf('day');
  const lastFiscalEnd = currentYearEnd.isAfter(datejs)
    ? currentYearEnd.subtract(1, 'year')
    : currentYearEnd;
  const lastFiscalStart = lastFiscalEnd.subtract(1, 'year').add(1, 'day');

  uxTests
    .filter((test) => test.status === 'Complete')
    .map((test) => {
      const project = test.project ? test.project.toString() : 'unknown';
      projectData[project] = projectData[project] || {
        testTypes: new Set(),
        tasks: new Set(),
        cops: new Set(),
        lastQuarterTests: new Set(),
        lastFiscalTests: new Set(),
      };

      projectData[project].testTypes.add(test.test_type);

      if (test.tasks) projectData[project].tasks.add(test.tasks.toString());
      if (test.cops) projectData[project].cops.add(test.test_type.toString());
      if (
        test.date >= lastQuarterStart.toDate() &&
        test.date <= lastQuarterEnd.toDate()
      )
        projectData[project].lastQuarterTests.add(test.test_type);
      if (
        test.date >= lastFiscalStart.toDate() &&
        test.date <= lastFiscalEnd.toDate()
      )
        projectData[project].lastFiscalTests.add(test.test_type);
    });

  let testsCompletedSince2018 = 0,
    tasksTestedSince2018 = 0,
    copsTestsCompletedSince2018 = 0,
    testsConductedLastQuarter = 0,
    testsConductedLastFiscal = 0;

  for (const project in projectData) {
    const { testTypes, tasks, cops, lastQuarterTests, lastFiscalTests } =
      projectData[project];
    testsCompletedSince2018 += testTypes.size;
    tasksTestedSince2018 += tasks.size;
    copsTestsCompletedSince2018 += cops.size;
    testsConductedLastQuarter += lastQuarterTests.size;
    testsConductedLastFiscal += lastFiscalTests.size;
  }

  tasksTestedSince2018 = Object.values(projectData).reduce((acc, { tasks }) => {
    tasks.forEach((task) => acc.add(task));
    return acc;
  }, new Set<string>()).size;

  const uniqueGroupMap = uxTests.reduce((map, test) => {
    const key = `${test.title}||${test.test_type}`;
    return map.set(key, { title: test.title, test_type: test.test_type });
  }, new Map());

  const uniqueGroups = Array.from(uniqueGroupMap.values());
  const uxTestsMaxUsers = uniqueGroups.map(({ title, test_type }) => {
    const filteredTests = uxTests
      .filter((test) => test.title === title && test.test_type === test_type)
      .map((test) => test.total_users)
      .filter((val) => typeof val === 'number' && !isNaN(val));

    return {
      title,
      test_type,
      total_users: filteredTests.length > 0 ? Math.max(...filteredTests) : 0,
    };
  });

  const participantsTestedSince2018 = uxTestsMaxUsers.reduce(
    (total, test) => total + test.total_users,
    0,
  );

  return {
    testsCompletedSince2018,
    tasksTestedSince2018,
    participantsTestedSince2018,
    testsConductedLastFiscal,
    testsConductedLastQuarter,
    copsTestsCompletedSince2018,
  };
}
