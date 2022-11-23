import { Module, ConsoleLogger } from '@nestjs/common';
import { AdobeAnalyticsService } from './adobe-analytics/adobe-analytics.service';
import { GoogleSearchConsoleService } from './google-search-console/google-search-console.service';

@Module({
  providers: [
    AdobeAnalyticsService,
    GoogleSearchConsoleService,
    ConsoleLogger,
  ],
  exports: [
    AdobeAnalyticsService,
    GoogleSearchConsoleService,
  ],
})
export class ExternalDataModule {}
