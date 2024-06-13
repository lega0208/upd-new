import { Controller, Get, ParseBoolPipe, Query } from '@nestjs/common';
import { OverallService } from './overall.service';

@Controller('overall')
export class OverallController {
  constructor(private readonly overallService: OverallService) {}

  @Get()
  getMetrics(
    @Query('dateRange') dateRange: string,
    @Query('comparisonDateRange') comparisonDateRange: string,
    @Query('ipd', ParseBoolPipe) ipd: boolean,
  ) {
    if (ipd) {
      console.log('IPD MODE ACTIVATED 🤖');
    }

    return this.overallService.getMetrics({
      dateRange,
      comparisonDateRange,
      ipd,
    });
  }
}
