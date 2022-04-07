import { CacheModule, Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Page,
  PageMetrics,
  PageMetricsSchema,
  PageSchema,
  Project,
  ProjectSchema,
  Task,
  TaskSchema,
  UxTest,
  UxTestSchema,
} from '@cra-arc/db';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Page.name, schema: PageSchema },
      { name: PageMetrics.name, schema: PageMetricsSchema },
      { name: Task.name, schema: TaskSchema },
      { name: UxTest.name, schema: UxTestSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    CacheModule.register(),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
