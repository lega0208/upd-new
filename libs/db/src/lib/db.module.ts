import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
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
import { ConfigModule } from '@nestjs/config';
import { getDbConnectionString } from './db.connection';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(getDbConnectionString(), {
      connectionName: 'defaultConnection',
      dbName: 'upd-test',
    }),
    MongooseModule.forFeature(
      [
        { name: CallDriver.name, schema: CallDriverSchema },
        { name: Feedback.name, schema: FeedbackSchema },
        { name: Overall.name, schema: OverallSchema },
        { name: PageMetrics.name, schema: PageMetricsSchema },
        { name: Page.name, schema: PageSchema },
        { name: PagesList.name, schema: PagesListSchema },
        { name: Task.name, schema: TaskSchema },
        { name: UxTest.name, schema: UxTestSchema },
        { name: Project.name, schema: ProjectSchema },
        { name: SearchAssessment.name, schema: SearchAssessmentSchema },
      ],
      'defaultConnection'
    ),
  ],
  providers: [],
  exports: [MongooseModule],
})
export class DbModule {}
