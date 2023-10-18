import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { DbModule, DbService } from '@dua-upd/db';
import { hours } from '@dua-upd/utils-common';

@Module({
  imports: [CacheModule.register({ ttl: hours(12) }), DbModule],
  controllers: [TasksController],
  providers: [TasksService, DbService],
})
export class TasksModule {}
