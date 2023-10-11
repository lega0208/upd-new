import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { DbModule } from '@dua-upd/db';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { hours } from '@dua-upd/utils-common';

@Module({
  imports: [CacheModule.register({ ttl: hours(12) }), DbModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
