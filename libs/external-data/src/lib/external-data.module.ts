import { Module, ConsoleLogger } from '@nestjs/common';
import { AdobeAnalyticsService } from './adobe-analytics/adobe-analytics.service';
import { GoogleSearchConsoleService } from './google-search-console/google-search-console.service';
import { AirtableService } from './airtable/airtable.service';

@Module({
  providers: [
    AdobeAnalyticsService,
    GoogleSearchConsoleService,
    AirtableService,
    ConsoleLogger,
  ],
  exports: [
    AdobeAnalyticsService,
    GoogleSearchConsoleService,
    AirtableService,
  ],
})
export class ExternalDataModule {}
