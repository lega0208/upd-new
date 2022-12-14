import { CacheModule, Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { DbModule, DbService } from '@dua-upd/db';

@Module({
  imports: [CacheModule.register({ ttl: 12 * 60 * 60 }), DbModule],
  controllers: [PagesController],
  providers: [PagesService, DbService],
})
export class PagesModule {}
