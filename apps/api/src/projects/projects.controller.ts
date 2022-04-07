import { Controller, Get, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('home')
  getProjectsHomeData(@Query('dateRange') dateRange: string) {
    return this.projectsService.getProjectsHomeData(dateRange);
  }

  @Get('details')
  getProjectDetails(
    @Query('id') id: string,
    @Query('dateRange') dateRange: string,
    @Query('comparisonDateRange') comparisonDateRange: string,
  ) {
    return this.projectsService.getProjectDetails({ id, dateRange, comparisonDateRange });
  }
}
