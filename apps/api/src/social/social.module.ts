import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedditModule } from '@dua-upd/external-data';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { minutes } from '@dua-upd/utils-common';

@Module({
  imports: [
    CacheModule.register({ ttl: minutes(15) }), // 15 minutes cache
    RedditModule,
  ],
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}