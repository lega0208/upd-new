import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdobeAnalyticsClient } from '../lib/adobe-analytics';
import { AirtableClient } from '../lib/airtable';
import { SearchAssessmentService } from './search-assessment.service';

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
  ],
  exports: [
    AdobeAnalyticsClient.name,
    AirtableClient.name,
    SearchAssessmentService,
  ],
})
export class SearchAssessmentModule {}
