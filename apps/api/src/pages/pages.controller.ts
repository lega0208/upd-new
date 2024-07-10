import {
  Controller,
  Get,
  Header,
  Query
} from '@nestjs/common';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get('home')
  @Header('Content-Type', 'application/json')
  getPagesHomeData(@Query('dateRange') dateRange: string) {
    return this.pagesService.getPagesHomeData(dateRange);
  }

  @Get('details')
  getPageDetails(
    @Query('id') id: string,
    @Query('dateRange') dateRange: string,
    @Query('comparisonDateRange') comparisonDateRange: string,
  ) {
    return this.pagesService.getPageDetails({ id, dateRange, comparisonDateRange });
  }
}
