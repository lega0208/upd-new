// eslint-disable-next-line @typescript-eslint/no-unused-vars
import zstd from '@mongodb-js/zstd'; // need to import this for it to be included in the build output
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AAItemId,
  AAItemIdSchema,
  CallDriver,
  CallDriverSchema,
  CustomReportsRegistry,
  CustomReportsRegistrySchema,
  Feedback,
  FeedbackSchema,
  GcTasks,
  GcTasksSchema,
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
  Readability,
  ReadabilitySchema,
  Annotations,
  AnnotationsSchema,
  Reports,
  ReportsSchema,
  CustomReportsMetrics,
  CustomReportsMetricsSchema,
} from './db.schemas';
import { PageVisitsViewSchema, PageVisitsView } from './db.views';
import {
  GCTasksMappings,
  GCTasksMappingsSchema,
} from './schemas/gc-tasks-mappings.schema';
import { PagesView, PagesViewSchema } from './views/pages-view.schema';
import { TasksView, TasksViewSchema } from './views/tasks-view.schema';
import { FeedbackViewRegistration } from './views/feedback-view.schema';

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
  readability: { model: Readability, schema: ReadabilitySchema },
  annotations: { model: Annotations, schema: AnnotationsSchema },
  reports: { model: Reports, schema: ReportsSchema },
  gcTasks: { model: GcTasks, schema: GcTasksSchema },
  gcTasksMappings: { model: GCTasksMappings, schema: GCTasksMappingsSchema },
  customReportsRegistry: {
    model: CustomReportsRegistry,
    schema: CustomReportsRegistrySchema,
  },
  customReportsMetrics: {
    model: CustomReportsMetrics,
    schema: CustomReportsMetricsSchema,
  },
} as const;

export const views = {
  pageVisits: { model: PageVisitsView, schema: PageVisitsViewSchema },
  pagesView: { model: PagesView, schema: PagesViewSchema },
  tasksView: { model: TasksView, schema: TasksViewSchema },
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
        FeedbackViewRegistration,
      ],
      'defaultConnection',
    ),
  ],
  providers: [],
  exports: [MongooseModule],
})
export class DbModule {
  static forRoot(
    production: boolean,
    prodHost = 'mongodb',
    dbName = 'upd-test',
  ) {
    const connectionString = `mongodb://${production ? prodHost : '127.0.0.1'}:27017/`;

    console.log(connectionString);

    return MongooseModule.forRoot(connectionString, {
      connectionName: 'defaultConnection',
      dbName,
      compressors: ['zstd', 'snappy'],
      retryWrites: true,
    });
  }
}
