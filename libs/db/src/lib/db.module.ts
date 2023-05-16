import zstd from '@mongodb-js/zstd'; // need to import this for it to be included in the build output
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { getDbConnectionString } from './db.connection';
import {
  AAItemId,
  AAItemIdSchema,
  CallDriver,
  CallDriverSchema,
  Feedback,
  FeedbackSchema,
  Overall,
  OverallSchema,
  Page,
  PageMetrics,
  PageMetricsSchema,
  PageMetricsTS,
  PageMetricsTSSchema,
  PageSchema,
  PagesList,
  PagesListSchema,
  Project,
  ProjectSchema,
  Task,
  TaskSchema,
  UxTest,
  UxTestSchema,
  SearchAssessment,
  SearchAssessmentSchema,
  Url,
  UrlSchema,
} from './db.schemas';
import { PageVisitsViewSchema, PageVisitsView } from './db.views';

export const models = {
  callDrivers: {
    model: CallDriver as typeof CallDriver,
    schema: CallDriverSchema,
  },
  feedback: { model: Feedback, schema: FeedbackSchema },
  overall: { model: Overall, schema: OverallSchema },
  pageMetrics: { model: PageMetrics, schema: PageMetricsSchema },
  pageMetricsTS: { model: PageMetricsTS, schema: PageMetricsTSSchema },
  pages: { model: Page, schema: PageSchema },
  pagesList: { model: PagesList, schema: PagesListSchema },
  tasks: { model: Task, schema: TaskSchema },
  uxTests: { model: UxTest, schema: UxTestSchema },
  projects: { model: Project, schema: ProjectSchema },
  searchAssessment: { model: SearchAssessment, schema: SearchAssessmentSchema },
  aaItemIds: { model: AAItemId, schema: AAItemIdSchema },
  urls: { model: Url, schema: UrlSchema },
} as const;

export const views = {
  pageVisits: { model: PageVisitsView, schema: PageVisitsViewSchema },
} as const;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
    }),
    MongooseModule.forFeature(
      [
        ...Object.values({ ...models, ...views }).map((collection) => ({
          name: collection.model.name,
          schema: collection.schema,
        })),
      ],
      'defaultConnection'
    ),
  ],
  providers: [],
  exports: [MongooseModule],
})
export class DbModule {
  static forRoot(production: boolean, dbName = 'upd-test') {
    const connectionString = getDbConnectionString(production, dbName);
    console.log(connectionString);

    return MongooseModule.forRoot(connectionString, {
      connectionName: 'defaultConnection',
      dbName,
      compressors: ['zstd', 'snappy'],
      retryWrites: false,
    });
  }
}
