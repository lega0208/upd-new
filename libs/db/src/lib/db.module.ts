import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getDbConnectionString } from './db.connection';
import { Collection, CollectionSchema, registerDiscriminator } from './schemas/collection.schema';
import {
  CalldriversConfig,
  FeedbackConfig,
  OverallConfig,
  PageConfig, PageMetrics, PageMetricsSchema,
  ProjectConfig,
  TaskConfig,
  UxTestConfig
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
export class DbModule {
  // constructor() {
  //   const discriminatorConfigs = [
  //     CalldriversConfig,
  //     FeedbackConfig,
  //     OverallConfig,
  //     PageConfig,
  //     ProjectConfig,
  //     TaskConfig,
  //     UxTestConfig,
  //   ];
  //
  //   for (const config of discriminatorConfigs) {
  //     registerDiscriminator(config);
  //   }
  // }
}
