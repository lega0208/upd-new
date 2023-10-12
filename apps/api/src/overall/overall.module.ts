import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { OverallService } from './overall.service';
import { OverallController } from './overall.controller';
import { DbModule, DbService } from '@dua-upd/db';
import { hours } from '@dua-upd/utils-common';

@Module({
  imports: [CacheModule.register({ ttl: hours(12) }), DbModule],
  controllers: [OverallController],
  providers: [OverallService, DbService],
})
export class OverallModule {}
