import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { PageMetrics, Project, UxTest, UxTestDocument } from '@cra-arc/db';
import type {
  ProjectDocument,
  PageMetricsModel,
  ProjectsHomeProject,
} from '@cra-arc/types-common';
import { ApiParams } from '@cra-arc/upd/services';
import { ProjectsHomeData } from '@cra-arc/types-common';

dayjs.extend(utc);

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @InjectModel(Project.name) private projectsModel: Model<ProjectDocument>,
    @InjectModel(UxTest.name) private uxTestsModel: Model<UxTestDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getProjectsHomeData(): Promise<ProjectsHomeData> {
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
            status: {
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
            },
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
              status: {
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
              },
            },
          },
        ],
        as: 'tests_aggregated',
      })
      .unwind('$tests_aggregated')
      .replaceRoot({
        // maybe current instead of root?>??
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

    return {
      ...aggregatedData,
      projects: projectsData,
    };
  }

  async getProjectDetails(params: ApiParams): Promise<unknown> {
    // todo: unimplemented
    return params;
  }
}
