import { CacheModule, Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { DbModule } from '@dua-upd/db';

@Module({
  imports: [CacheModule.register({ ttl: 12 * 60 * 60 }), DbModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
