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
  Task, DbModule
} from '@cra-arc/db';

@Module({
  imports: [
    DbModule,
    CacheModule.register(),
  ],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
