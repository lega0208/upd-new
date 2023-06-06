import { CacheModule, Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { DbModule, DbService } from '@dua-upd/db';
import { hours } from '@dua-upd/utils-common';

@Module({
  imports: [CacheModule.register({ ttl: hours(12) }), DbModule],
  controllers: [PagesController],
  providers: [PagesService, DbService],
})
export class PagesModule {}
