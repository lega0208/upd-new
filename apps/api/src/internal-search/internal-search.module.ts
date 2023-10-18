import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { InternalSearchService } from './internal-search.service';
import { InternalSearchController } from './internal-search.controller';
import { DbModule, DbService } from '@dua-upd/db';

@Module({
  imports: [CacheModule.register({ ttl: 12 * 60 * 60 }), DbModule],
  controllers: [InternalSearchController],
  providers: [InternalSearchService, DbService],
})
export class InternalSearchModule {}
