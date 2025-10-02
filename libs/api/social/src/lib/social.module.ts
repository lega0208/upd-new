import { Module } from '@nestjs/common';
import { RedditModule } from '@dua-upd/external-data';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [RedditModule],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}