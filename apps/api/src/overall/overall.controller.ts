import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { OverallService } from './overall.service';

@Controller('overall')
export class OverallController {
  constructor(private readonly overallService: OverallService) {}

  @Get('/getMetrics')
  getMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.overallService.getMetrics({ startDate, endDate });
  }

  @Get('/getVisits')
  getVisits() {
    return this.overallService.getVisits();
  }
}
