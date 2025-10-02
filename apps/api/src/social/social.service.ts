import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedditService, RedditApiResponse } from '@dua-upd/external-data';
import { compressString, decompressString } from '@dua-upd/node-utils';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly redditService: RedditService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async fetchRedditData(): Promise<RedditApiResponse> {
    const cacheKey = 'social:reddit:data';

    // Check cache first
    try {
      const cachedData = await this.cacheManager.store.get<string>(cacheKey);

      if (cachedData) {
        this.logger.log('Returning cached Reddit data');
        const decompressed = await decompressString(cachedData);
        return JSON.parse(decompressed);
      }
    } catch (error) {
      this.logger.error('Error reading from cache', error);
      // Continue to fetch fresh data if cache fails
    }

    // Fetch fresh data if not in cache
    this.logger.log('Fetching fresh Reddit data...');

    try {
      const data = await this.redditService.fetchRedditData();

      // Cache the data (compressed)
      try {
        const compressed = await compressString(JSON.stringify(data));
        await this.cacheManager.store.set(cacheKey, compressed);
        this.logger.log('Reddit data cached successfully');
      } catch (cacheError) {
        this.logger.error('Failed to cache Reddit data', cacheError);
        // Continue even if caching fails
      }

      return data;
    } catch (error) {
      this.logger.error('Failed to fetch Reddit data', error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    const cacheKey = 'social:reddit:data';
    try {
      await this.cacheManager.store.del(cacheKey);
      this.logger.log('Reddit data cache cleared');
    } catch (error) {
      this.logger.error('Error clearing cache', error);
      throw error;
    }
  }
}