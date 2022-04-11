import { CacheModule, Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DbModule,
  Page,
  PageMetrics,
  PageMetricsSchema,
  PageSchema,
  Project,
  ProjectSchema,
  Task,
  TaskSchema,
  UxTest,
  UxTestSchema
} from '@cra-arc/db';

@Module({
  imports: [
    DbModule,
    CacheModule.register(),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
