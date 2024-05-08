import { Injectable } from '@nestjs/common';
import type { FilterQuery } from 'mongoose';
import { omit } from 'rambdax';
import { DbService, Feedback } from '@dua-upd/db';
import { round, type DateRange } from '@dua-upd/utils-common';
import { FeedbackCache } from './feedback.cache';
import {
  calculateWordScores,
  getCommentRelevanceScores as getCommentScores,
  getAvgScore,
} from '@dua-upd/feedback';
import type {
  FeedbackWithScores,
  IFeedback,
  MostRelevantCommentsAndWords,
} from '@dua-upd/types-common';

export type FeedbackParams = {
  dateRange: DateRange<Date>;
  type?: 'page' | 'task' | 'project';
  id?: string;
  normalizationStrength?: number;
};

@Injectable()
export class FeedbackService {
  constructor(
    private db: DbService,
    private cache: FeedbackCache,
  ) {}

  async getComments(params: FeedbackParams) {
    const cachedComments = await this.cache.get<IFeedback[]>('comments', {
      dateRange: params.dateRange,
      type: params.type,
      id: params.id,
    });

    if (cachedComments) {
      return cachedComments;
    }

    console.time(
      `Fetching comments ${params.type || ''}${params.id || ''} from db`,
    );

    const comments = await this.db.collections.feedback
      .find(paramsToQuery(params), { airtable_id: 0, unique_id: 0, __v: 0 })
      .lean()
      .exec();

    console.timeEnd(
      `Fetching comments ${params.type || ''}${params.id || ''} from db`,
    );

    // don't cache overview
    if (params.type) {
      await this.cache.set('comments', params, comments);
    }

    return comments;
  }

  async getMostRelevantCommentsAndWords(params: FeedbackParams) {
    const comments = await this.getComments(params);

    const enComments = comments.filter((comment) => comment.lang === 'EN');
    const frComments = comments.filter((comment) => comment.lang === 'FR');

    const enWordScores = calculateWordScores(enComments);
    const frWordScores = calculateWordScores(frComments);

    const startTime = Date.now();

    // probably other fields can be omitted as well?
    const enCommentsWithScores = getCommentScores(
      comments,
      enWordScores,
      params.normalizationStrength,
    )
      .map((comment) => omit(['words'], comment))
      .sort((a, b) => (b.tf_idf_normalized || 0) - (a.tf_idf_normalized || 0));
    const frCommentsWithScores = getCommentScores(
      comments,
      frWordScores,
      params.normalizationStrength,
    )
      .map((comment) => omit(['words'], comment))
      .sort((a, b) => (b.tf_idf_normalized || 0) - (a.tf_idf_normalized || 0));

    // drop comments and words with scores below these thresholds (only dropped from cache & display, not calculation)
    const WORD_SCORE_THRESHOLD = 0;

    const COMMENTS_SCORE_THRESHOLD_EN =
      getCommentScoreThreshold(enCommentsWithScores);

    const COMMENTS_SCORE_THRESHOLD_FR =
      getCommentScoreThreshold(frCommentsWithScores);

    const mostRelevant: MostRelevantCommentsAndWords = {
      en: {
        comments: enCommentsWithScores.filter((comment) => {
          const avgScore = getAvgScore(comment);

          return avgScore && avgScore >= COMMENTS_SCORE_THRESHOLD_EN;
        }),
        words: enWordScores.filter((word) => {
          const avgScore = getAvgScore(word);

          return avgScore && avgScore >= WORD_SCORE_THRESHOLD;
        }),
      },
      fr: {
        comments: frCommentsWithScores.filter((comment) => {
          const avgScore = getAvgScore(comment);

          return avgScore && avgScore >= COMMENTS_SCORE_THRESHOLD_FR;
        }),
        words: frWordScores.filter((word) => {
          const avgScore = getAvgScore(word);

          return avgScore && avgScore >= WORD_SCORE_THRESHOLD;
        }),
      },
    };

    console.log('getCommentsWithWordScores - before cache');
    for (const [key, value] of Object.entries(process.memoryUsage())) {
      console.log(`Memory usage by ${key}, ${round(value / 1000000, 2)}MB `);
    }
    await this.cache.set('mostRelevant', params, mostRelevant);

    console.log('\ngetCommentsWithWordScores - after cache');
    for (const [key, value] of Object.entries(process.memoryUsage())) {
      console.log(`Memory usage by ${key}, ${round(value / 1000000, 2)}MB `);
    }

    const endTime = Date.now();

    console.log(
      `Comments cache miss for comments ${params.type || ''} ${
        params.id || ''
      } in ${round((endTime - startTime) / 1000, 3)}s`,
    );

    return mostRelevant;
  }
}

function paramsToQuery(params: FeedbackParams) {
  const query: FilterQuery<Feedback> = {
    date: {
      $gte: params.dateRange.start,
      $lte: params.dateRange.end,
    },
  };

  if (params.type && !params.id) {
    throw new Error(
      'Id is required when type is provided. Received type: ' + params.type,
    );
  }

  if (params.id && !params.type) {
    throw new Error(
      'Type is required when id is provided. Received id: ' + params.id,
    );
  }

  if (params.type === 'page') {
    query.page = params.id;

    return query;
  }

  query[`${params.type}s`] = params.id;

  return query;
}

function getCommentScoreThreshold(comments: FeedbackWithScores[]) {
  if (comments.length > 300_000) {
    return 0.5;
  }

  if (comments.length > 200_000) {
    return 0.3;
  }

  if (comments.length > 100_000) {
    return 0.2;
  }

  if (comments.length > 50_000) {
    return 0.1;
  }

  if (comments.length > 20_000) {
    return 0.01;
  }

  return 0.001;
}
