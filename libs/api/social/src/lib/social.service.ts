import { Injectable, Logger } from '@nestjs/common';
import { RedditService, RedditApiResponse } from '@dua-upd/external-data';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);
  private cachedData: RedditApiResponse | null = null;
  private lastFetchTime: Date | null = null;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly redditService: RedditService) {}

  async fetchRedditData(): Promise<RedditApiResponse> {
    this.logger.log('Fetching fresh Reddit data...');

    try {
      const data = await this.redditService.fetchRedditData();

      // Cache the data
      this.cachedData = data;
      this.lastFetchTime = new Date();

      return data;
    } catch (error) {
      this.logger.error('Failed to fetch Reddit data', error);
      throw error;
    }
  }

  async getRecentPosts() {
    const data = await this.getCachedOrFreshData();
    return data.posts;
  }

  async getSentimentAnalysis() {
    const data = await this.getCachedOrFreshData();
    return {
      distribution: data.sentiment,
      totalAnalyzed: data.posts.length + data.comments.length,
    };
  }

  async getSubredditStats() {
    const data = await this.getCachedOrFreshData();
    return data.stats;
  }

  async getRecurringIssues() {
    const data = await this.getCachedOrFreshData();
    return data.issues || [];
  }

  private async getCachedOrFreshData(): Promise<RedditApiResponse> {
    // Check if we have cached data that's still valid
    if (
      this.cachedData &&
      this.lastFetchTime &&
      Date.now() - this.lastFetchTime.getTime() < this.CACHE_DURATION_MS
    ) {
      this.logger.log('Returning cached Reddit data');
      return this.cachedData;
    }

    // Otherwise fetch fresh data
    return this.fetchRedditData();
  }
}