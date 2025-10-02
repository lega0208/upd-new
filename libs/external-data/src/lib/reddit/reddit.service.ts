import { Injectable, Logger } from '@nestjs/common';
import { RedditClient } from './reddit.client';
import { OpenRouterClient } from '../openrouter';
import {
  RedditPost,
  RedditComment,
  RedditApiResponse,
  SubredditStats,
  RecurringIssue,
} from './reddit.types';

@Injectable()
export class RedditService {
  private readonly logger = new Logger(RedditService.name);
  private readonly CRA_SUBREDDITS = [
    'PersonalFinanceCanada',
    'cantax',
    'canada',
    'CanadaPublicServants',
    'ontario',
    'quebec',
    'britishcolumbia',
    'alberta',
  ];
  private readonly CRA_SEARCH_TERMS = [
    'CRA',
    'Canada Revenue Agency',
    'tax',
    'tax return',
    'income tax',
    'GST',
    'HST',
    'T4',
    'T1',
    'benefits',
    'CERB',
    'EI',
    'child benefit',
    'tax refund',
    'audit',
    'MyAccount',
  ];

  constructor(
    private readonly redditClient: RedditClient,
    private readonly openRouterClient: OpenRouterClient,
  ) {}

  async fetchRedditData(): Promise<RedditApiResponse> {
    this.logger.log('Starting Reddit data fetch...');

    try {
      // Fetch posts from CRA-related subreddits
      const posts = await this.fetchCRAPosts();

      // Fetch comments for top posts
      const comments = await this.fetchCommentsForPosts(posts.slice(0, 10));

      // Analyze sentiment using AI
      const postsWithSentiment = await this.analyzeSentimentForPosts(posts);
      const commentsWithSentiment = await this.analyzeSentimentForComments(comments);

      // Calculate statistics
      const stats = this.calculateSubredditStats(postsWithSentiment, commentsWithSentiment);

      // Identify recurring issues
      const issues = this.identifyRecurringIssues(postsWithSentiment, commentsWithSentiment);

      // Calculate overall sentiment
      const allSentiments = [
        ...postsWithSentiment.map(p => p.sentiment),
        ...commentsWithSentiment.map(c => c.sentiment),
      ].filter(s => s !== undefined);

      const sentimentCounts = {
        positive: allSentiments.filter(s => s === 'positive').length,
        neutral: allSentiments.filter(s => s === 'neutral').length,
        negative: allSentiments.filter(s => s === 'negative').length,
      };

      const totalEngagement = posts.reduce((sum, post) => sum + post.numComments, 0);
      const engagementRate = posts.length > 0
        ? Math.round((totalEngagement / posts.length) * 100) / 100
        : 0;

      return {
        posts: postsWithSentiment,
        comments: commentsWithSentiment,
        stats,
        totalPosts: posts.length,
        totalComments: comments.length,
        activeSubreddits: new Set(posts.map(p => p.subreddit)).size,
        engagementRate,
        sentiment: sentimentCounts,
        issues,
      };
    } catch (error) {
      this.logger.error('Failed to fetch Reddit data', error);
      throw error;
    }
  }

  private async fetchCRAPosts(): Promise<RedditPost[]> {
    const allPosts: RedditPost[] = [];
    const searchQuery = this.CRA_SEARCH_TERMS.join(' OR ');

    for (const subreddit of this.CRA_SUBREDDITS) {
      try {
        // Search for CRA-related posts
        const searchResults = await this.redditClient.searchSubreddits(
          [subreddit],
          searchQuery,
          25,
          'week'
        );

        const posts = searchResults.map(rawPost =>
          this.redditClient.parsePost(rawPost)
        );

        allPosts.push(...posts);

        // Also get recent hot posts from the subreddit
        const hotPosts = await this.redditClient.getSubredditPosts(subreddit, 'hot', 10);

        // Filter for CRA-related content
        const filteredHotPosts = hotPosts
          .map(rawPost => this.redditClient.parsePost(rawPost))
          .filter(post => this.isCRARelated(post));

        allPosts.push(...filteredHotPosts);
      } catch (error) {
        this.logger.error(`Failed to fetch posts from r/${subreddit}`, error);
      }
    }

    // Remove duplicates and sort by score
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.id, post])).values()
    );

    return uniquePosts.sort((a, b) => b.score - a.score);
  }

  private async fetchCommentsForPosts(posts: RedditPost[]): Promise<RedditComment[]> {
    const allComments: RedditComment[] = [];

    for (const post of posts) {
      try {
        const rawComments = await this.redditClient.getPostComments(
          post.id,
          post.subreddit,
          50
        );

        const comments = rawComments.map(rawComment =>
          this.redditClient.parseComment(rawComment)
        );

        allComments.push(...comments);
      } catch (error) {
        this.logger.error(`Failed to fetch comments for post ${post.id}`, error);
      }
    }

    return allComments;
  }

  private isCRARelated(post: RedditPost): boolean {
    const textToCheck = (post.title + ' ' + (post.content || '')).toLowerCase();

    return this.CRA_SEARCH_TERMS.some(term =>
      textToCheck.includes(term.toLowerCase())
    );
  }

  private async analyzeSentimentForPosts(posts: RedditPost[]): Promise<RedditPost[]> {
    this.logger.log(`Analyzing sentiment for ${posts.length} posts...`);

    // Prepare texts for batch analysis
    const textsToAnalyze = posts.map(post =>
      post.title + (post.content ? ' ' + post.content : '')
    );

    try {
      // Use batch analysis for efficiency
      const sentimentResults = await this.openRouterClient.analyzeSentimentBatch(textsToAnalyze);

      // Map results back to posts
      return posts.map((post, index) => ({
        ...post,
        sentiment: sentimentResults[index]?.sentiment || 'neutral',
        sentimentConfidence: sentimentResults[index]?.confidence,
        sentimentReasoning: sentimentResults[index]?.reasoning,
      }));
    } catch (error) {
      this.logger.error('Error analyzing sentiment for posts', error);
      // Fallback to neutral if analysis fails
      return posts.map(post => ({
        ...post,
        sentiment: 'neutral' as 'positive' | 'negative' | 'neutral',
      }));
    }
  }

  private async analyzeSentimentForComments(comments: RedditComment[]): Promise<RedditComment[]> {
    this.logger.log(`Analyzing sentiment for ${comments.length} comments...`);

    // Limit to first 50 comments to avoid excessive API calls
    const commentsToAnalyze = comments.slice(0, 50);
    const remainingComments = comments.slice(50);

    try {
      // Analyze first batch
      const sentimentResults = await this.openRouterClient.analyzeSentimentBatch(
        commentsToAnalyze.map(c => c.body)
      );

      // Map results
      const analyzedComments = commentsToAnalyze.map((comment, index) => ({
        ...comment,
        sentiment: sentimentResults[index]?.sentiment || 'neutral',
        sentimentConfidence: sentimentResults[index]?.confidence,
        sentimentReasoning: sentimentResults[index]?.reasoning,
      }));

      // Mark remaining as neutral to save API calls
      const neutralComments = remainingComments.map(comment => ({
        ...comment,
        sentiment: 'neutral' as 'positive' | 'negative' | 'neutral',
      }));

      return [...analyzedComments, ...neutralComments];
    } catch (error) {
      this.logger.error('Error analyzing sentiment for comments', error);
      // Fallback to neutral if analysis fails
      return comments.map(comment => ({
        ...comment,
        sentiment: 'neutral' as 'positive' | 'negative' | 'neutral',
      }));
    }
  }

  private calculateSubredditStats(
    posts: RedditPost[],
    comments: RedditComment[]
  ): SubredditStats[] {
    const subredditMap = new Map<string, SubredditStats>();

    // Initialize stats for each subreddit
    posts.forEach(post => {
      if (!subredditMap.has(post.subreddit)) {
        subredditMap.set(post.subreddit, {
          subreddit: post.subreddit,
          totalPosts: 0,
          totalComments: 0,
          avgScore: 0,
          avgSentiment: 'neutral',
        });
      }

      const stats = subredditMap.get(post.subreddit)!;
      stats.totalPosts += 1;
      stats.totalComments += post.numComments;
      stats.avgScore += post.score;
    });

    // Calculate averages and sentiment
    const statsArray = Array.from(subredditMap.values()).map(stats => {
      if (stats.totalPosts > 0) {
        stats.avgScore = Math.round(stats.avgScore / stats.totalPosts);
      }

      // Calculate average sentiment for the subreddit
      const subredditPosts = posts.filter(p => p.subreddit === stats.subreddit);
      const sentiments = subredditPosts.map(p => p.sentiment).filter(s => s !== undefined);

      const sentimentCounts = {
        positive: sentiments.filter(s => s === 'positive').length,
        neutral: sentiments.filter(s => s === 'neutral').length,
        negative: sentiments.filter(s => s === 'negative').length,
      };

      const maxSentiment = Object.entries(sentimentCounts)
        .sort(([, a], [, b]) => b - a)[0];

      stats.avgSentiment = (maxSentiment?.[0] as any) || 'neutral';

      return stats;
    });

    return statsArray.sort((a, b) => b.totalPosts - a.totalPosts);
  }

  private identifyRecurringIssues(
    posts: RedditPost[],
    comments: RedditComment[]
  ): RecurringIssue[] {
    // Common CRA-related issues to track
    const issueCategories = {
      'Account Access': ['login', 'password', 'myaccount', 'locked', 'access denied'],
      'Refund Delays': ['refund', 'waiting', 'delay', 'processing', 'still waiting'],
      'Technical Issues': ['error', 'website', 'down', 'not working', 'glitch', 'bug'],
      'Tax Filing': ['file', 'filing', 'submit', 'deadline', 'extension', 'late'],
      'Benefits': ['benefit', 'payment', 'cerb', 'ei', 'child benefit', 'gst credit'],
      'Communication': ['call', 'phone', 'wait time', 'hold', 'contact', 'email'],
      'Documentation': ['form', 'document', 'paperwork', 't4', 't1', 'notice'],
      'Audit': ['audit', 'review', 'verification', 'proof', 'documentation request'],
    };

    const issues: RecurringIssue[] = [];
    let issueId = 1;

    for (const [category, keywords] of Object.entries(issueCategories)) {
      let frequency = 0;
      const relatedKeywords = new Set<string>();

      // Check posts
      posts.forEach(post => {
        const text = (post.title + ' ' + (post.content || '')).toLowerCase();
        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            frequency++;
            relatedKeywords.add(keyword);
          }
        });
      });

      // Check comments
      comments.forEach(comment => {
        const text = comment.body.toLowerCase();
        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            frequency++;
            relatedKeywords.add(keyword);
          }
        });
      });

      if (frequency > 0) {
        issues.push({
          id: `issue-${issueId++}`,
          title: `${category} Issues`,
          category,
          frequency,
          keywords: Array.from(relatedKeywords),
          description: `Recurring mentions of ${category.toLowerCase()} related problems`,
        });
      }
    }

    return issues.sort((a, b) => b.frequency - a.frequency);
  }
}