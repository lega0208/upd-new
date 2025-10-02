import { Controller, Delete, Post, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('api/social')
export class SocialController {
  private readonly logger = new Logger(SocialController.name);

  constructor(private readonly socialService: SocialService) {}

  @Post('reddit/fetch')
  async fetchRedditData() {
    try {
      this.logger.log('Handling Reddit data fetch request...');
      const data = await this.socialService.fetchRedditData();
      return data;
    } catch (error) {
      this.logger.error('Failed to fetch Reddit data', error);
      throw new HttpException(
        'Failed to fetch Reddit data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('reddit/cache')
  async clearRedditCache() {
    try {
      this.logger.log('Clearing Reddit data cache...');
      await this.socialService.clearCache();
      return { success: true, message: 'Cache cleared successfully' };
    } catch (error) {
      this.logger.error('Failed to clear cache', error);
      throw new HttpException(
        'Failed to clear cache',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}