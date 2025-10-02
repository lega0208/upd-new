import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { RedditCredentials, RedditPost, RedditComment } from './reddit.types';

@Injectable()
export class RedditClient {
  private readonly logger = new Logger(RedditClient.name);
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://oauth.reddit.com',
      headers: {
        'User-Agent': process.env.REDDIT_USER_AGENT || 'UPD-Social-Listening/1.0',
      },
    });
  }

  private async authenticate(): Promise<void> {
    const clientId = process.env.REDDIT_CLIENT_ID?.trim();
    const clientSecret = process.env.REDDIT_CLIENT_SECRET?.trim();

    this.logger.log('Reddit credentials check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0,
      clientSecretLength: clientSecret?.length || 0,
    });

    if (!clientId || !clientSecret) {
      throw new Error('Reddit API credentials not configured - missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET');
    }

    // Check if token is still valid
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      this.logger.log('Using existing valid token');
      return;
    }

    try {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      this.logger.log('Requesting Reddit OAuth token with client_credentials grant...');

      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': process.env.REDDIT_USER_AGENT || 'UPD-Social-Listening/1.0',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in 1 hour, refresh 5 minutes early
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 300) * 1000);

      // Update axios instance with new token
      this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${this.accessToken}`;

      this.logger.log('Successfully authenticated with Reddit API');
    } catch (error: any) {
      this.logger.error('Failed to authenticate with Reddit API', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Reddit authentication failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async searchSubreddits(
    subreddits: string[],
    searchQuery: string,
    limit: number = 25,
    timeFilter: string = 'week'
  ): Promise<any[]> {
    await this.authenticate();

    const posts: any[] = [];

    for (const subreddit of subreddits) {
      try {
        this.logger.log(`Searching r/${subreddit} for: ${searchQuery}`);

        const response = await this.axiosInstance.get(`/r/${subreddit}/search`, {
          params: {
            q: searchQuery,
            restrict_sr: '1',  // Use '1' instead of 'on' for API
            sort: 'new',       // Sort by new to get recent posts
            t: timeFilter,
            limit,
          },
        });

        if (response.data?.data?.children) {
          const validPosts = response.data.data.children.filter((post: any) => {
            // Filter out posts older than 7 days
            const postDate = new Date(post.data.created_utc * 1000);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return postDate >= sevenDaysAgo;
          });

          this.logger.log(`Found ${validPosts.length} posts in r/${subreddit}`);
          posts.push(...validPosts);
        }

        // Rate limiting - Reddit allows 60 requests per minute
        await this.sleep(1000);
      } catch (error: any) {
        this.logger.error(`Failed to search r/${subreddit}: ${error.message}`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
    }

    return posts;
  }

  async getSubredditPosts(
    subreddit: string,
    sort: 'hot' | 'new' | 'top' = 'hot',
    limit: number = 25,
    timeFilter?: string
  ): Promise<any[]> {
    await this.authenticate();

    try {
      const params: any = { limit };
      if (timeFilter && sort === 'top') {
        params.t = timeFilter;
      }

      const response = await this.axiosInstance.get(`/r/${subreddit}/${sort}`, { params });

      if (response.data?.data?.children) {
        return response.data.data.children;
      }
      return [];
    } catch (error) {
      this.logger.error(`Failed to fetch posts from r/${subreddit}`, error);
      return [];
    }
  }

  async getPostComments(postId: string, subreddit: string, limit: number = 100): Promise<any[]> {
    await this.authenticate();

    try {
      const response = await this.axiosInstance.get(
        `/r/${subreddit}/comments/${postId}`,
        { params: { limit } }
      );

      if (Array.isArray(response.data) && response.data.length > 1) {
        // First element is the post, second is comments
        return this.flattenComments(response.data[1]);
      }
      return [];
    } catch (error) {
      this.logger.error(`Failed to fetch comments for post ${postId}`, error);
      return [];
    }
  }

  private flattenComments(commentData: any): any[] {
    const comments: any[] = [];

    const traverse = (node: any) => {
      if (node?.data?.children) {
        for (const child of node.data.children) {
          if (child.kind === 't1' && child.data) { // t1 is comment type
            comments.push(child);
            if (child.data.replies) {
              traverse(child.data.replies);
            }
          }
        }
      }
    };

    traverse(commentData);
    return comments;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  parsePost(rawPost: any): RedditPost {
    const data = rawPost.data;
    return {
      id: data.id,
      title: data.title,
      content: data.selftext || undefined,
      author: data.author,
      subreddit: data.subreddit,
      score: data.score,
      upvoteRatio: data.upvote_ratio,
      numComments: data.num_comments,
      createdUtc: new Date(data.created_utc * 1000),
      url: data.url,
      isSelf: data.is_self,
      flairText: data.link_flair_text,
    };
  }

  parseComment(rawComment: any): RedditComment {
    const data = rawComment.data;
    return {
      id: data.id,
      postId: data.link_id?.replace('t3_', ''),
      body: data.body,
      author: data.author,
      score: data.score,
      createdUtc: new Date(data.created_utc * 1000),
    };
  }
}