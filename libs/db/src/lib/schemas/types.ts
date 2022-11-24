export type AccumulatorOperator =
  | '$accumulator'
  | '$addToSet'
  | '$avg'
  | '$count'
  | '$first'
  | '$last'
  | '$max'
  | '$mergeObjects'
  | '$min'
  | '$push'
  | '$stdDevPop'
  | '$stdDevSamp'
  | '$sum';

export interface GscSearchTermMetrics {
  term: string;
  clicks: number;
  ctr: number;
  impressions: number;
  position: number;
}

export interface AASearchTermMetrics {
  term: string;
  clicks: number;
  position?: number;
}

export interface FeedbackComment {
  url: string;
  date: Date;
  tag: string;
  whats_wrong: string;
  comment: string;
}

export interface CallsByTopic {
  tpc_id: string;
  topic: string;
  subtopic: string;
  sub_subtopic: string;
  calls: number;
}

export interface TopCalldriverTopics extends CallsByTopic {
  change: number | 'Infinity';
}

export interface AttachmentData {
  id: string;
  url: string;
  filename: string;
}

export interface SearchAssessmentData {
  lang: string;
  query: string;
  expected_url: string;
  expected_position: number;
  pass: boolean;
  visits: number;
}
