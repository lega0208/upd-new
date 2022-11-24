import { CacheModule, ConsoleLogger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule, DbService } from '@dua-upd/db';
import {
  AdobeAnalyticsClient,
  AirtableClient, ExternalDataModule,
  SearchAnalyticsClient
} from '@dua-upd/external-data';
import { DbUpdateService } from './db-update.service';
import { OverallMetricsService } from './overall-metrics/overall-metrics.service';
import { AirtableService } from './airtable/airtable.service';
import { CalldriversService } from './airtable/calldrivers.service';
import { FeedbackService } from './airtable/feedback.service';
import { PageUpdateService } from './pages/pages.service';
import { PageMetricsService } from './pages-metrics/page-metrics.service';
import { PagesListService } from './pages-list/pages-list.service';
import { InternalSearchTermsService } from './internal-search/search-terms.service';

@Module({
  imports: [
    CacheModule.register({ ttl: 12 * 60 * 60 }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DbModule,
    ExternalDataModule,
  ],
  providers: [
    DbService,
    DbUpdateService,
    ConsoleLogger,
    {
      provide: AdobeAnalyticsClient.name,
      useValue: new AdobeAnalyticsClient(),
    },
    {
      provide: AirtableClient.name,
      useValue: new AirtableClient(),
    },
    {
      provide: SearchAnalyticsClient.name,
      useValue: new SearchAnalyticsClient(),
    },
    OverallMetricsService,
    AirtableService,
    CalldriversService,
    FeedbackService,
    PageUpdateService,
    PageMetricsService,
    PagesListService,
    InternalSearchTermsService,
  ],
  exports: [
    DbModule,
    DbUpdateService,
    AdobeAnalyticsClient.name,
    AirtableClient.name,
    SearchAnalyticsClient.name,
    AirtableService,
    CalldriversService,
    FeedbackService,
    OverallMetricsService,
    PageMetricsService,
    PageUpdateService,
    PagesListService,
    InternalSearchTermsService,
  ],
})
export class DbUpdateModule {}
