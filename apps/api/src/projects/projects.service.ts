import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { PageMetrics, Project } from '@cra-arc/db';
import type { ProjectDocument, PageMetricsModel } from '@cra-arc/types-common';
import { ApiParams } from '@cra-arc/upd/services';
import { ProjectsHomeData } from '@cra-arc/types-common';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getProjectsHomeData(): Promise<ProjectsHomeData> {
    // dummy data for now until the db is remodeled

    return {
      numInProgress: 8,
      numCompletedLast6Months: 7,
      totalCompleted: 35,
      numDelayed: 2,
      projects: [
        {
          _id: '621d280492982ac8c344d36d',
          title: 'Outreach',
          cops: true,
          startDate: new Date('2021-01-10'),
          avgSuccessRate: 2.61,
          status: 'Planning',
        },
        {
          _id: '621d280492982ac8c344d36e',
          title: 'CERS pre launch MVP',
          cops: false,
          startDate: new Date('2021-01-10'),
          launchDate: new Date('2021-03-10'),
          avgSuccessRate: 0.27,
          status: 'In progress',
        },
        {
          _id: '621d280492982ac8c344d370',
          title: 'Home work space expenses - User experience web content improvements - R1 (prototype)',
          cops: true,
          startDate: new Date('2021-01-10'),
          launchDate: new Date('2023-12-25'),
          avgSuccessRate: 0.0666,
          status: 'Complete',
        }
      ],
    };
  }

  async getProjectDetails(params: ApiParams): Promise<unknown> {
    // todo: unimplemented
    return params;
  }
}
