import type { Types } from 'mongoose';
import type { IFeedback } from './schema.types';

export const scoringMethods = [
  'tf_idf',
  'tf_idf_ipf',
  'tf_idf_logscale',
  'tf_idf_ipf_logscale',
  'andre_score',
] as const;

const scoringMethodsNormalized = scoringMethods.map(
  (method) => `${method}_normalized` as const,
);

export const allScoringMethods = [
  ...scoringMethods,
  ...scoringMethodsNormalized,
];

export type ScoringMethod = (typeof scoringMethods)[number];

export type NormalizedScoringMethod = `${ScoringMethod}_normalized`;

export type FeedbackScores = {
  [Method in ScoringMethod]: number | null;
};

export type FeedbackNormalizedScores = {
  [Method in NormalizedScoringMethod]: number | null;
};

export type FeedbackRelevanceScores = FeedbackScores &
  FeedbackNormalizedScores & {
    normalization_factor: number;
  };

export type CommentRelevanceScores = FeedbackRelevanceScores & {
  _id: Types.ObjectId;
};

export type FeedbackWithScores = IFeedback & FeedbackRelevanceScores;

export type WordRelevance = {
  words: string;
  term_occurrences_total: number;
  comment_occurrences_total: number;
  page_occurrences_total: number;
  term_frequency: number;
  term_frequency_logscale: number;
  page_frequency: number;
  comment_frequency: number;
  inverse_doc_frequency: number;
  inverse_page_frequency: number;
  tf_idf: number;
  tf_idf_ipf: number;
  tf_idf_logscale: number;
  tf_idf_ipf_logscale: number;
  andre_score: number;
};

export type MostRelevantCommentsAndWords = {
  en: {
    comments: Omit<FeedbackWithScores, 'words'>[];
    words: WordRelevance[];
  };
  fr: {
    comments: Omit<FeedbackWithScores, 'words'>[];
    words: WordRelevance[];
  };
};