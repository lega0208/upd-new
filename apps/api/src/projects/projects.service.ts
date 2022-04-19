import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  GscSearchTermMetrics,
  PageMetrics,
  Project,
  UxTest,
  UxTestDocument,
} from '@cra-arc/db';
import type {
  ProjectDocument,
  PageMetricsModel,
  ProjectsHomeProject,
  ProjectsDetailsData,
} from '@cra-arc/types-common';
import { ApiParams } from '@cra-arc/upd/services';
import {
  OverviewAggregatedData,
  ProjectDetailsAggregatedData,
  ProjectsHomeData
} from '@cra-arc/types-common';

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

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @InjectModel(Project.name) private projectsModel: Model<ProjectDocument>,
    @InjectModel(UxTest.name) private uxTestsModel: Model<UxTestDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getProjectsHomeData(): Promise<ProjectsHomeData> {
    const cacheKey = `getProjectsHomeData`;
    const cachedData = await this.cacheManager.store.get<ProjectsHomeData>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const defaultData = {
      numInProgress: 0,
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
            numDelayed: {
              $sum: {
                $cond: [{ $eq: ['$_id', 'Delayed'] }, '$count', 0],
              },
            },
          })
          .project({
            _id: 0,
            numInProgress: 1,
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
    const cachedData = await this.cacheManager.store.get<ProjectsDetailsData>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const projectData = (
      await this.projectsModel
        .aggregate<ProjectsDetailsData>()
        .match({ _id: new Types.ObjectId(params.id) })
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
              $project: {
                title: 1,
                status: { $ifNull: ['$status', 'Unknown'] },
                date: 1,
                test_type: { $ifNull: ['$test_type', 'Unknown test type'] },
                success_rate: 1,
                tasks: 1,
                total_users: 1,
                successful_users: 1,
                project_lead: 1,
                vendor: 1
              },
            },
            {
              $group: {
                _id: {
                  // assuming they're the same "test" if the date, test type, tasks are the same:
                  title: '$title',
                  test_type: '$test_type',
                  date: '$date',
                  tasks: { $first: '$tasks'},
                  total_users: '$total_users',
                  successful_users: '$successful_users',
                  project_lead: '$project_lead',
                  vendor: '$vendor'
                },
                status: { $first: '$status' },
                successRate: { $avg: '$success_rate' },
              },
            },
            {
              $project: {
                _id: 0,
                title: '$_id.title',
                tasks: '$_id.tasks',
                date: '$_id.date',
                testType: '$_id.test_type',
                totalUsers: '$_id.total_users',
                successfulUsers: '$_id.successful_users',
                projectLead: '$_id.project_lead',
                vendor: '$_id.vendor',
                status: 1,
                successRate: 1,
              }
            },
            {
              $sort: { date: -1 },
            },
          ],
          as: 'ux_tests',
        })
        .project({
          title: 1,
          statuses: '$ux_tests.status',
          lastTest: { $first: '$ux_tests' },
          ux_tests: 1,
        })
        .project({
          title: 1,
          status: projectStatusSwitchExpression,
          avgTaskSuccessFromLastTest: '$lastTest.successRate',
          dateFromLastTest: '$lastTest.date',
          taskSuccessByUxTest: '$ux_tests',
        })
        .exec()
    )[0];

    const results = {
      dateRange: params.dateRange,
      comparisonDateRange: params.comparisonDateRange,
      dateRangeData: await getAggregatedProjectMetrics(
        this.pageMetricsModel,
        new Types.ObjectId(params.id),
        params.dateRange
      ),
      comparisonDateRangeData: await getAggregatedProjectMetrics(
        this.pageMetricsModel,
        new Types.ObjectId(params.id),
        params.comparisonDateRange
      ),
      ...projectData,
    };

    await this.cacheManager.set(cacheKey, results);

    return results;
  }
}

async function getAggregatedProjectMetrics(
  pageMetricsModel: PageMetricsModel,
  id: Types.ObjectId,
  dateRange: string
): Promise<ProjectDetailsAggregatedData> {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  return (
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
        gscTotalCtr: { $sum: '$gsc_total_ctr' },
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
        gscTotalCtr: { $sum: '$gscTotalCtr' },
        gscTotalPosition: { $avg: '$gscTotalPosition' },
      })
      .project({ _id: 0 })
      .exec()
  )[0];
}
