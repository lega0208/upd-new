import { CacheModule, ConsoleLogger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import dayjs from 'dayjs';
import { BlobStorageModule } from '@dua-upd/blob-storage';
import { LoggerModule } from '@dua-upd/logger';
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
import { UrlsService } from './urls/urls.service';
import { ReadabilityService } from './readability/readability.service';

const date = dayjs().format('YYYY-MM-DD');
const month = dayjs().format('YYYY-MM');

@Module({})
export class DbUpdateModule {
  static register(production = false) {
    return {
      module: DbUpdateModule,
      imports: [
        CacheModule.register({ ttl: 12 * 60 * 60 }),
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
        }),
        DbModule,
        ExternalDataModule,
        BlobStorageModule,
        LoggerModule.withBlobLogger('DB_UPDATE_LOGGER', {
          blobModel: 'db_updates',
          context: 'db-update',
          logLevelTargets: {
            error: `${month}/db-update_errors_${date}`,
            warn: `${month}/db-update_${date}`,
            log: `${month}/db-update-${date}`,
          },
        }),
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
        UrlsService,
        {
          provide: AirtableClient.name,
          useValue: new AirtableClient(),
        },
        {
          provide: 'ENV',
          useValue: production,
        },
        ReadabilityService,
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
        ReadabilityService,
        SearchAssessmentService,
        UrlsService,
      ],
    };
  }
}
