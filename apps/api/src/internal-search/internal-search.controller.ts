import { Controller, Get, Query } from '@nestjs/common';
import { InternalSearchService } from './internal-search.service';

@Controller('internal-search')
export class InternalSearchController {
  constructor(private readonly internalSearch: InternalSearchService) {}

  @Get('terms')
  getInternalSearchTermsData(@Query('lang') lang: 'en' | 'fr', @Query('dateRange') dateRange: string) {
    return this.internalSearch.getInternalSearchTerms(lang, dateRange);
  }

  @Get('master')
  getMasterList(@Query('lang') lang: 'en' | 'fr') {
    return this.internalSearch.getMasterList(lang);
  }

}
