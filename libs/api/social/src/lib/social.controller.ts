import { Controller, Get, Post, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SocialService } from './social.service';

@ApiTags('Social Listening')
@Controller('social')
export class SocialController {
  private readonly logger = new Logger(SocialController.name);

  constructor(private readonly socialService: SocialService) {}

  @Post('reddit/fetch')
  @ApiOperation({ summary: 'Fetch and analyze Reddit data' })
  @ApiResponse({ status: 200, description: 'Reddit data fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async fetchRedditData() {
    try {
      this.logger.log('Fetching Reddit data...');
      const data = await this.socialService.fetchRedditData();
      return {
        success: true,
        data,
      };
    } catch (error) {
      this.logger.error('Failed to fetch Reddit data', error);
      throw new HttpException(
        'Failed to fetch Reddit data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('reddit/posts')
  @ApiOperation({ summary: 'Get recent Reddit posts' })
  @ApiResponse({ status: 200, description: 'Returns recent Reddit posts' })
  async getRedditPosts() {
    try {
      const posts = await this.socialService.getRecentPosts();
      return {
        success: true,
        data: posts,
      };
    } catch (error) {
      this.logger.error('Failed to get Reddit posts', error);
      throw new HttpException(
        'Failed to get Reddit posts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('reddit/sentiment')
  @ApiOperation({ summary: 'Get sentiment analysis data' })
  @ApiResponse({ status: 200, description: 'Returns sentiment analysis' })
  async getSentimentAnalysis() {
    try {
      const sentiment = await this.socialService.getSentimentAnalysis();
      return {
        success: true,
        data: sentiment,
      };
    } catch (error) {
      this.logger.error('Failed to get sentiment analysis', error);
      throw new HttpException(
        'Failed to get sentiment analysis',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('reddit/stats')
  @ApiOperation({ summary: 'Get subreddit statistics' })
  @ApiResponse({ status: 200, description: 'Returns subreddit statistics' })
  async getSubredditStats() {
    try {
      const stats = await this.socialService.getSubredditStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('Failed to get subreddit stats', error);
      throw new HttpException(
        'Failed to get subreddit stats',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('reddit/issues')
  @ApiOperation({ summary: 'Get recurring issues' })
  @ApiResponse({ status: 200, description: 'Returns recurring issues' })
  async getRecurringIssues() {
    try {
      const issues = await this.socialService.getRecurringIssues();
      return {
        success: true,
        data: issues,
      };
    } catch (error) {
      this.logger.error('Failed to get recurring issues', error);
      throw new HttpException(
        'Failed to get recurring issues',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}