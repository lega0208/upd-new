import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdobeAnalyticsClient } from '../lib/adobe-analytics';
import { AirtableClient } from '../lib/airtable';
import { SearchAssessmentService } from './search-assessment.service';
import { AdobeAnalyticsService } from '../lib/adobe-analytics/adobe-analytics.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: AdobeAnalyticsClient.name,
      useValue: new AdobeAnalyticsClient(),
    },
    {
      provide: AirtableClient.name,
      useValue: new AirtableClient(),
    },
    SearchAssessmentService,
    AdobeAnalyticsService,
  ],
  exports: [
    AdobeAnalyticsClient.name,
    AirtableClient.name,
    SearchAssessmentService,
    AdobeAnalyticsService,
  ],
})
export class SearchAssessmentModule {}
