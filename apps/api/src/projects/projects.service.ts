import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Feedback,
  Page,
  PageMetrics,
  Project,
  Task,
  UxTest,
  UxTestDocument,
} from '@cra-arc/db';
import type {
  FeedbackDocument,
  PageDocument,
  ProjectDocument,
  PageMetricsModel,
  ProjectsHomeProject,
  ProjectsDetailsData,
  ProjectStatus,
  FeedbackComment,
  ProjectDetailsAggregatedData,
  ProjectsHomeData,
} from '@cra-arc/types-common';
import { ApiParams } from '@cra-arc/upd/services';
import { dateRangeSplit } from '@cra-arc/utils-common/date';

dayjs.extend(utc);

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

const getProjectStatus = (statuses: ProjectStatus[]): ProjectStatus => {
  if (statuses.length === 0) {
    return 'Unknown';
  }

  switch (true) {
    case statuses.every((status) => status === 'Complete'):
      return 'Complete';
    case statuses.some((status) => status === 'Delayed'):
      return 'Delayed';
    case statuses.some((status) => status === 'In Progress'):
      return 'In Progress';
    case statuses.some((status) => status === 'Planning'):
      return 'Planning';
    default:
      return 'Unknown';
  }
};

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @InjectModel(Project.name) private projectsModel: Model<ProjectDocument>,
    @InjectModel(UxTest.name) private uxTestsModel: Model<UxTestDocument>,
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getProjectsHomeData(): Promise<ProjectsHomeData> {
    const cacheKey = `getProjectsHomeData`;
    const cachedData = await this.cacheManager.store.get<ProjectsHomeData>(
      cacheKey
    );

    if (cachedData) {
      return cachedData;
    }

    const defaultData = {
      numInProgress: 0,
      numPlanning: 0,
      numCompletedLast6Months: 0,
      totalCompleted: 0,
      numDelayed: 0,
    };

    const sixMonthsAgo = dayjs().utc(false).subtract(6, 'months').toDate();

    const aggregatedData =
      (
        await this.uxTestsModel
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
            totalCompleted: {
              $sum: {
                $cond: [{ $eq: ['$_id', 'Complete'] }, '$count', 0],
              },
            },
            numPlanning: {
              $sum: {
                $cond: [{ $eq: ['$_id', 'Planning'] }, '$count', 0],
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
            numPlanning: 1,
            numCompletedLast6Months: 1,
            totalCompleted: 1,
            numDelayed: 1,
          })
          .exec()
      )[0] || defaultData;

    const projectsData = await this.projectsModel
      .aggregate<ProjectsHomeProject>()
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
      });

    const results = {
      ...aggregatedData,
      projects: projectsData,
    };

    await this.cacheManager.set(cacheKey, results);

    return results;
  }

  async getProjectDetails(params: ApiParams): Promise<ProjectsDetailsData> {
    if (!params.id) {
      throw Error(
        'Attempted to get Project details from API but no id was provided.'
      );
    }

    const cacheKey = `getProjectDetails-${params.id}-${params.dateRange}-${params.comparisonDateRange}`;
    const cachedData = await this.cacheManager.store.get<ProjectsDetailsData>(
      cacheKey
    );

    if (cachedData) {
      return cachedData;
    }

    const projectId = new Types.ObjectId(params.id);

    const projectDoc = await this.projectsModel.findById(projectId);

    const projectUrls = await getUniqueProjectUrls(projectDoc);

    const populatedProjectDoc = (await this.projectsModel
      .findById(projectId, { title: 1, tasks: 1, ux_tests: 1 })
      .populate('tasks', ['_id', 'title'])
      .populate({
        path: 'ux_tests',
        select: '-project -pages',
        populate: {
          path: 'tasks',
          select: '_id title',
        },
      })
      .exec()) as Project;

    const title = populatedProjectDoc.title;

    const status = getProjectStatus(
      (populatedProjectDoc.ux_tests as UxTest[])
        .filter((test) => !(test instanceof Types.ObjectId))
        .map((test) => test.status as ProjectStatus)
    );

    const uxTests = populatedProjectDoc.ux_tests.map((uxTest) => {
      uxTest = uxTest._doc;

      if (!('tasks' in uxTest) || !uxTest.tasks.length) {
        return {
          ...uxTest,
          tasks: '',
        };
      }

      const tasks =
        uxTest.tasks.length > 1
          ? uxTest.tasks.map((task) => task._doc.title).join('; ')
          : uxTest.tasks[0].title;

      return {
        ...uxTest,
        tasks,
      };
    }) as (Partial<UxTest> & { tasks: string })[];

    const lastTest = uxTests.reduce((latestTest, test) => {
      if (latestTest === null) {
        return test;
      }

      if (test.date > latestTest.date) {
        return test;
      }

      return latestTest;
    }, null);

    const dateFromLastTest: Date | void = lastTest?.date || null;

    const avgTaskSuccessFromLastTest = getAvgSuccessFromLastTests(
      dateFromLastTest,
      uxTests
    );

    const tasks = populatedProjectDoc.tasks as Task[];

    const results = {
      _id: populatedProjectDoc._id.toString(),
      dateRange: params.dateRange,
      comparisonDateRange: params.comparisonDateRange,
      dateRangeData: await getAggregatedProjectMetrics(
        this.pageMetricsModel,
        this.feedbackModel,
        new Types.ObjectId(params.id),
        params.dateRange,
        projectUrls
      ),
      comparisonDateRangeData: await getAggregatedProjectMetrics(
        this.pageMetricsModel,
        this.feedbackModel,
        new Types.ObjectId(params.id),
        params.comparisonDateRange,
        projectUrls
      ),
      title,
      status,
      avgTaskSuccessFromLastTest,
      dateFromLastTest,
      taskSuccessByUxTest: uxTests,
      tasks,
      feedbackComments: await getProjectFeedbackComments(
        params.dateRange,
        projectUrls,
        this.feedbackModel
      ),
    };

    await this.cacheManager.set(cacheKey, results);

    return results;
  }
}

async function getAggregatedProjectMetrics(
  pageMetricsModel: PageMetricsModel,
  feedbackModel: Model<FeedbackDocument>,
  id: Types.ObjectId,
  dateRange: string,
  projectUrls: string[]
): Promise<ProjectDetailsAggregatedData> {
  const [startDate, endDate] = dateRangeSplit(dateRange);

  const feedbackByTags = await feedbackModel
    .aggregate<{ tag: string; numComments: number }>()
    .match({
      url: { $in: projectUrls },
      date: { $gte: startDate, $lte: endDate },
    })
    .unwind('$tags')
    .group({
      _id: '$tags',
      numComments: { $sum: 1 },
    })
    .project({
      _id: 0,
      tag: '$_id',
      numComments: 1,
    });

  const projectMetrics = (
    await pageMetricsModel
      .aggregate<ProjectDetailsAggregatedData>()
      .sort({ date: 1, projects: 1 })
      .match({ date: { $gte: startDate, $lte: endDate }, projects: id })
      .group({
        _id: '$url',
        page: { $first: '$page' },
        visits: { $sum: '$visits' },
        dyfYes: { $sum: '$dyf_yes' },
        dyfNo: { $sum: '$dyf_no' },
        fwylfCantFindInfo: { $sum: '$fwylf_cant_find_info' },
        fwylfHardToUnderstand: { $sum: '$fwylf_hard_to_understand' },
        fwylfOther: { $sum: '$fwylf_other' },
        fwylfError: { $sum: '$fwylf_error' },
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
      // .addFields({ _id: '$page' })
      .project({ page: 0 })
      .sort({ title: 1 })
      .group({
        _id: null,
        visitsByPage: {
          $push: '$$ROOT',
        },
        visits: { $sum: '$visits' },
        dyfYes: { $sum: '$dyfYes' },
        dyfNo: { $sum: '$dyfNo' },
        fwylfCantFindInfo: { $sum: '$fwylfCantFindInfo' },
        fwylfHardToUnderstand: { $sum: '$fwylfHardToUnderstand' },
        fwylfOther: { $sum: '$fwylfOther' },
        fwylfError: { $sum: '$fwylfError' },
        gscTotalClicks: { $sum: '$gscTotalClicks' },
        gscTotalImpressions: { $sum: '$gscTotalImpressions' },
        gscTotalCtr: { $avg: '$gscTotalCtr' },
        gscTotalPosition: { $avg: '$gscTotalPosition' },
      })
      .project({ _id: 0 })
      .exec()
  )[0];

  return {
    ...projectMetrics,
    feedbackByTags,
  };
}

function getAvgSuccessFromLastTests(
  lastTestDate: Date | void,
  uxTests: Partial<UxTest>[]
) {
  const lastTests = uxTests.filter(
    (test) =>
      test.date &&
      lastTestDate instanceof Date &&
      test.date.getTime() === lastTestDate.getTime()
  );

  const lastTestsByType = lastTests.reduce((acc, test) => {
    if (!test.test_type) {
      return acc;
    }

    if (!(test.test_type in acc)) {
      acc[test.test_type] = [];
    }

    acc[test.test_type].push(test);

    return acc;
  }, {} as { [key: string]: Partial<UxTest>[] });

  const testTypes = Object.keys(lastTestsByType);

  // If there are no tests, return null
  if (testTypes.length === 0) {
    return null;
  }

  // If there are validation tests, take these as the "latest test"
  if (lastTestsByType['Validation']) {
    return (
      lastTestsByType['Validation']
        .map((test) => test.success_rate)
        .filter(
          (successRate) => successRate !== undefined && successRate !== null
        )
        .reduce((total, success_rate) => total + success_rate, 0) /
      lastTestsByType['Validation'].length
    );
  }

  // Otherwise use baseline tests
  if (lastTestsByType['Baseline']) {
    return (
      lastTestsByType['Baseline']
        .map((test) => test.success_rate)
        .reduce((total, success_rate) => total + success_rate, 0) /
      lastTestsByType['Baseline'].length
    );
  }

  // If no validation or baseline tests, use whatever we have
  const allTests = testTypes.reduce(
    (acc, key) => acc.concat(lastTestsByType[key]),
    [] as Partial<UxTest>[]
  );

  return (
    allTests
      .map((test) => test.success_rate)
      .reduce((total, success_rate) => total + success_rate, 0) /
    allTests.length
  );
}

async function getProjectFeedbackComments(
  dateRange: string,
  projectUrls: string[],
  feedbackModel: Model<FeedbackDocument>
): Promise<FeedbackComment[]> {
  const [startDate, endDate] = dateRangeSplit(dateRange);

  return (
    (await feedbackModel.find({
      url: { $in: projectUrls },
      date: { $gte: startDate, $lte: endDate },
    })) || []
  ).map((feedback) => ({
    date: feedback.date,
    url: feedback.url,
    tag: feedback.tags?.length ? feedback.tags[0] : '',
    whats_wrong: feedback.whats_wrong || '',
    comment: feedback.comment,
  }));
}

async function getUniqueProjectUrls(
  project: ProjectDocument
): Promise<string[]> {
  const projectPageUrls = ((await project.populate('pages')).pages || []).map(
    (page) => 'url' in page && [page.url, ...(page.all_urls || [])]
  );

  return [...new Set(projectPageUrls.flat())];
}
