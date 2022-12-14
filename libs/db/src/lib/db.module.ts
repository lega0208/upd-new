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
  pages: { model: Page, schema: PageSchema },
  pagesList: { model: PagesList, schema: PagesListSchema },
  tasks: { model: Task, schema: TaskSchema },
  uxTests: { model: UxTest, schema: UxTestSchema },
  projects: { model: Project, schema: ProjectSchema },
  searchAssessment: { model: SearchAssessment, schema: SearchAssessmentSchema },
  aaItemIds: { model: AAItemId, schema: AAItemIdSchema },
} as const;

export const views = {
  pageVisits: { model: PageVisitsView, schema: PageVisitsViewSchema },
} as const;

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(getDbConnectionString(), {
      connectionName: 'defaultConnection',
      dbName: 'upd-test',
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
export class DbModule {}
