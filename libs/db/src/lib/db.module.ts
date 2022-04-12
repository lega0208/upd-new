import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Collection, CollectionSchema } from './schemas/collection.schema';
import {
  CalldriversConfig,
  FeedbackConfig,
  OverallConfig,
  PageConfig,
  PageMetrics,
  PageMetricsSchema,
  ProjectConfig,
  TaskConfig,
  UxTestConfig,
} from './db.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PageMetrics.name, schema: PageMetricsSchema },
      {
        name: Collection.name,
        schema: CollectionSchema,
        discriminators: [
          CalldriversConfig,
          FeedbackConfig,
          OverallConfig,
          PageConfig,
          ProjectConfig,
          TaskConfig,
          UxTestConfig,
        ],
      },
    ]),
  ],
  providers: [],
  exports: [MongooseModule],
})
export class DbModule {}
