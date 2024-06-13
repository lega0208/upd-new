import type { IFeedback } from './schema.types';

export type FeedbackWithScores = IFeedback & {
  rank?: number;
  commentScore?: number;
  // pageScore?: number; // not using page score for now
  owners?: string;
  sections?: string;
};

export type WordRelevance = {
  word: string;
  word_occurrences: number;
  comment_occurrences: number;
  // page_occurrences: number;
  term_frequency: number;
  // page_frequency: number;
  comment_frequency: number;
  inverse_doc_frequency: number;
  // inverse_page_frequency: number;
  comment_score: number;
  // page_score: number;
};

export type MostRelevantCommentsAndWords = {
  comments: Omit<FeedbackWithScores, 'words'>[];
  words: WordRelevance[];
};

export type MostRelevantCommentsAndWordsByLang = {
  en: MostRelevantCommentsAndWords;
  fr: MostRelevantCommentsAndWords;
};