import { Controller, Get, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('home')
  getTasksHomeData(@Query('dateRange') dateRange: string, @Query('comparisonDateRange') comparisonDateRange: string) {
    return this.tasksService.getTasksHomeData(dateRange, comparisonDateRange);
  }

  @Get('details')
  async getTaskDetails(
    @Query('id') id: string,
    @Query('dateRange') dateRange: string,
    @Query('comparisonDateRange') comparisonDateRange: string,
  ) {
    return await this.tasksService.getTaskDetails({ id, dateRange, comparisonDateRange });
  }
}
