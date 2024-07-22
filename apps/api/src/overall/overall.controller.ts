import { Controller, Get, Header, ParseBoolPipe, Query } from '@nestjs/common';
import { OverallService } from './overall.service';

@Controller('overall')
export class OverallController {
  constructor(private readonly overallService: OverallService) {}

  @Get()
  @Header('Content-Type', 'application/json')
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

  @Get('feedback')
  @Header('Content-Type', 'application/json')
  getFeedback(
    @Query('dateRange') dateRange: string,
    @Query('comparisonDateRange') comparisonDateRange: string,
    @Query('ipd', ParseBoolPipe) ipd: boolean,
  ) {
    if (ipd) {
      console.log('IPD MODE ACTIVATED 🤖');
    }

    return this.overallService.getFeedback({
      dateRange,
      comparisonDateRange,
      ipd,
    });
  }
}
