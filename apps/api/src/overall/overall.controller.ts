import { Controller, Get, Query } from '@nestjs/common';
import { OverallService } from './overall.service';

@Controller('overall')
export class OverallController {
  constructor(private readonly overallService: OverallService) {}

  @Get()
  getMetrics(
    @Query('dateRange') dateRange: string,
    @Query('comparisonDateRange') comparisonDateRange: string,
  ) {
    console.log('getMetrics');
    return this.overallService.getMetrics({ dateRange, comparisonDateRange });
  }
}
