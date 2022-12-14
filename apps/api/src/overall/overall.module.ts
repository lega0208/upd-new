import { CacheModule, Module } from '@nestjs/common';

import { OverallService } from './overall.service';
import { OverallController } from './overall.controller';
import { DbModule, DbService } from '@dua-upd/db';

@Module({
  imports: [CacheModule.register({ ttl: 12 * 60 * 60 }), DbModule],
  controllers: [OverallController],
  providers: [OverallService, DbService],
})
export class OverallModule {}
