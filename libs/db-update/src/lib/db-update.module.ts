import { CacheModule, ConsoleLogger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule, DbService } from '@dua-upd/db';
import {
  AdobeAnalyticsClient, AdobeAnalyticsService,
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
import { logJson } from '@dua-upd/utils-common';

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
    AirtableService,
    CalldriversService,
    ConsoleLogger,
    DbService,
    DbUpdateService,
    InternalSearchTermsService,
    FeedbackService,
    OverallMetricsService,
    PageUpdateService,
    PageMetricsService,
    PagesListService,
    {
      provide: AirtableClient.name,
      useValue: new AirtableClient(),
    },
  ],
  exports: [
    AirtableClient.name,
    AirtableService,
    CalldriversService,
    DbModule,
    DbUpdateService,
    ExternalDataModule,
    FeedbackService,
    InternalSearchTermsService,
    OverallMetricsService,
    PageMetricsService,
    PageUpdateService,
    PagesListService,
  ],
})
export class DbUpdateModule {
}
