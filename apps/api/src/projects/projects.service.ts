import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { PageMetrics, Project } from '@cra-arc/db';
import type { ProjectDocument, PageMetricsModel } from '@cra-arc/types-common';
import { ApiParams } from '@cra-arc/upd/services';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getProjectsHomeData(dateRange: string): Promise<unknown[]> {
    console.log(dateRange);
    // todo: unimplemented
    return [];
  }

  async getProjectDetails(params: ApiParams): Promise<unknown> {
    // todo: unimplemented
    return params;
  }
}
