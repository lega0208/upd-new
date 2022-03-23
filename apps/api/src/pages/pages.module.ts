import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import {
  PageSchema,
  Page,
  PageMetricsSchema,
  PageMetrics,
  TaskSchema,
  Task,
} from '@cra-arc/db';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Page.name, schema: PageSchema },
      { name: PageMetrics.name, schema: PageMetricsSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    CacheModule.register(),
  ],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
