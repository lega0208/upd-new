import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CallDriver,
  CallDriverDocument,
  Overall,
  OverallDocument,
  Project,
  ProjectDocument,
  Task,
  TaskDocument,
  UxTest,
  UxTestDocument,
} from '@cra-arc/db';
import type {
  PageMetricsModel,
  ProjectsHomeData,
  ProjectsHomeProject,
} from '@cra-arc/types-common';
import { FilterQuery, Model } from 'mongoose';
import { ApiParams } from '@cra-arc/upd/services';
import { OverviewAggregatedData, OverviewData } from '@cra-arc/types-common';
import { PageMetrics } from '@cra-arc/types-common';
import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
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
export class OverallService {
  constructor(
    @InjectModel(Overall.name) private overallModel: Model<OverallDocument>,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(UxTest.name) private uxTestModel: Model<UxTestDocument>,
    @InjectModel(CallDriver.name)
    private calldriversModel: Model<CallDriverDocument>,
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

    const results = {
      dateRange: params.dateRange,
      comparisonDateRange: params.comparisonDateRange,
      dateRangeData: await getOverviewMetrics(
        this.overallModel,
        this.pageMetricsModel,
        this.calldriversModel,
        this.cacheManager,
        params.dateRange
      ),
      comparisonDateRangeData: await getOverviewMetrics(
        this.overallModel,
        this.pageMetricsModel,
        this.calldriversModel,
        this.cacheManager,
        params.comparisonDateRange
      ),
      projects: await getProjects(this.projectModel, this.uxTestModel),
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
              }
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
            completedSince2018 : 1,
            numCompletedLast6Months: 1,
            totalCompleted: 1,
            numDelayed: 1,
          })
          .exec()
      )[0] || defaultData;

  const projectsData = await projectModel
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

  const results = {
    ...aggregatedData,
    ...uxTest,
    projects: projectsData,
  };

  return results;
}

async function getUxTests(
  uxTestsModel: Model<UxTestDocument>
): Promise<UxTest[]> {
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
          numInProgress: 1,
          numCompletedLast6Months: 1,
          completedSince2018: 1,
          totalCompleted: 1,
          numDelayed: 1,
          copsCompletedSince2018: 1,
        })
        .exec()
    )[0] || defaultData;

  return { ...uxTest };
}

async function getOverviewMetrics(
  overallModel: Model<OverallDocument>,
  PageMetricsModel: PageMetricsModel,
  calldriversModel: Model<CallDriverDocument>,
  cacheManager: Cache,
  dateRange: string
): Promise<OverviewAggregatedData> {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const dateQuery: FilterQuery<Date> = {};

  dateQuery.$gte = new Date(startDate);
  dateQuery.$lte = new Date(endDate);

  const visitsByDay = await overallModel
    .find({ date: dateQuery }, { _id: 0, date: 1, visits: 1 })
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
      _id: null,
      enquiryLineBE: {
        $sum: {
          $cond: [{ $eq: ['$enquiry_line', 'BE'] }, '$calls', 0],
        },
      },
      enquiryLineBenefits: {
        $sum: {
          $cond: [{ $eq: ['$enquiry_line', 'Benefits'] }, '$calls', 0],
        },
      },
      enquiryLineC4: {
        $sum: {
          $cond: [{ $eq: ['$enquiry_line', 'C4 - Identity Theft'] }, '$calls', 0],
        },
      },
      enquiryLineC9: {
        $sum: {
          $cond: [{ $eq: ['$enquiry_line', 'C9 - My Account Lockout'] }, '$calls', 0],
        },
      },
      enquiryLineITE: {
        $sum: {
          $cond: [{ $eq: ['$enquiry_line', 'ITE'] }, '$calls', 0],
        },
      },
      enquiryLineEService: {
        $sum: {
          $cond: [{ $eq: ['$enquiry_line', 'e-Services Help Desk'] }, '$calls', 0],
        },
      },

    })
    .project({
      _id: 0,
      enquiryLineBE: 1,
      enquiryLineBenefits: 1,
      enquiryLineC4: 1,
      enquiryLineC9 : 1,
      enquiryLineITE: 1,
      enquiryLineEService: 1,
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

  const aggregatedMetrics = await overallModel
    .aggregate<
      Omit<OverviewAggregatedData, 'visitsByDay' | 'calldriversByDay'>
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

  return {
    visitsByDay,
    calldriversByDay,
    ...calldriversEnquiry[0],
    ...aggregatedMetrics[0],
    topPagesVisited,
    top10GSC,
  };
}
