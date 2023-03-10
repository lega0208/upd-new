import { CacheModule, ConsoleLogger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlobStorageModule } from '@dua-upd/blob-storage';
import { DbModule, DbService } from '@dua-upd/db';
import {
  AirtableClient,
  ExternalDataModule,
  SearchAssessmentService,
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
import { ActivityMapService } from './activity-map/activity-map.service';

@Module({
  imports: [
    CacheModule.register({ ttl: 12 * 60 * 60 }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
    }),
    DbModule,
    ExternalDataModule,
    BlobStorageModule,
  ],
  providers: [
    AirtableService,
    CalldriversService,
    ConsoleLogger,
    DbService,
    DbUpdateService,
    InternalSearchTermsService,
    ActivityMapService,
    FeedbackService,
    OverallMetricsService,
    PageUpdateService,
    PageMetricsService,
    PagesListService,
    SearchAssessmentService,
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
    DbService,
    DbUpdateService,
    ExternalDataModule,
    FeedbackService,
    InternalSearchTermsService,
    ActivityMapService,
    OverallMetricsService,
    PageMetricsService,
    PageUpdateService,
    PagesListService,
    SearchAssessmentService,
  ],
})
export class DbUpdateModule {}
