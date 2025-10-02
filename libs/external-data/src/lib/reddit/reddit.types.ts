export interface RedditPost {
  id: string;
  title: string;
  content?: string;
  author: string;
  subreddit: string;
  score: number;
  upvoteRatio: number;
  numComments: number;
  createdUtc: Date;
  url: string;
  isSelf: boolean;
  flairText?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentConfidence?: number;
  sentimentReasoning?: string;
}

export interface RedditComment {
  id: string;
  postId: string;
  body: string;
  author: string;
  score: number;
  createdUtc: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentConfidence?: number;
  sentimentReasoning?: string;
}

export interface SubredditStats {
  subreddit: string;
  totalPosts: number;
  totalComments: number;
  avgScore: number;
  avgSentiment: 'positive' | 'negative' | 'neutral';
}

export interface RedditApiResponse {
  posts: RedditPost[];
  comments: RedditComment[];
  stats: SubredditStats[];
  totalPosts: number;
  totalComments: number;
  activeSubreddits: number;
  engagementRate: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  issues?: RecurringIssue[];
}

export interface RecurringIssue {
  id: string;
  title: string;
  description?: string;
  category: string;
  frequency: number;
  keywords: string[];
  firstSeen?: Date;
  lastSeen?: Date;
}

export interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  userAgent?: string;
}

export interface RedditSearchParams {
  subreddits: string[];
  searchTerms: string[];
  limit?: number;
  timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
}