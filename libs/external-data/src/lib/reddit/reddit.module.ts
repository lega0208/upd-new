import { Module } from '@nestjs/common';
import { RedditClient } from './reddit.client';
import { RedditService } from './reddit.service';
import { OpenRouterModule } from '../openrouter';

@Module({
  imports: [OpenRouterModule],
  providers: [RedditClient, RedditService],
  exports: [RedditService],
})
export class RedditModule {}