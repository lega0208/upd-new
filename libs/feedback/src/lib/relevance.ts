import {
  type FeedbackWithScores,
  type IFeedback,
  type NormalizedScoringMethod,
  type ScoringMethod,
  allScoringMethods,
  scoringMethods,
  type WordRelevance,
} from '@dua-upd/types-common';
import { col, lit, Float64 } from 'nodejs-polars';
import { toDataframe } from './utils';
import { zip } from 'rambdax';
import { avg, isNullish, round } from '@dua-upd/utils-common';

export function calculateWordScores(comments: IFeedback[]) {
  const filteredComments = comments.filter((comment) => comment.words?.length);

  if (!filteredComments.length) {
    return [] as WordRelevance[];
  }

  const df = toDataframe(filteredComments);

  const totalComments = filteredComments.length;
  const totalPages = df.select(col('url').nUnique()).getColumn('url').get(0);
  const totalTerms = df
    .select(col('words').explode().count())
    .getColumn('words')
    .get(0);

  const tf_idf = df
    .withRowCount('id')
    .select(col('id'), col('url'), col('words').alias('words'))
    .explode('words')
    .withColumns(col('words').count().over('url').alias('num_page_terms'))
    .groupBy(['url', 'words'])
    .agg(
      col('num_page_terms').first(),
      col('words').count().alias('term_occurrences'),
      col('id').nUnique().alias('comment_occurrences'),
    )
    .groupBy('words')
    .agg(
      col('term_occurrences').sum().alias('term_occurrences_total'),
      col('comment_occurrences').sum().alias('comment_occurrences_total'),
      col('url').nUnique().alias('page_occurrences_total'),
    )
    .withColumns(
      col('term_occurrences_total').div(totalTerms).alias('term_frequency'),
      col('term_occurrences_total')
        .plus(lit(1))
        .log()
        .alias('term_frequency_logscale'),
      col('page_occurrences_total').div(totalPages).alias('page_frequency'),
      col('comment_occurrences_total')
        .div(totalComments)
        .alias('comment_frequency'),
      lit(totalComments)
        .div(col('comment_occurrences_total'))
        .log()
        .alias('inverse_doc_frequency'),
      lit(totalPages)
        .div(col('page_occurrences_total'))
        .log()
        .alias('inverse_page_frequency'),
    )
    .withColumns(
      col('term_frequency')
        .mul(col('inverse_doc_frequency'))
        .round(3)
        .alias('tf_idf'),
      col('term_frequency')
        .mul(col('inverse_doc_frequency'))
        .mul(col('inverse_page_frequency'))
        .round(3)
        .alias('tf_idf_ipf'),
      col('term_frequency_logscale')
        .mul(col('inverse_doc_frequency'))
        .round(3)
        .alias('tf_idf_logscale'),
      col('term_frequency_logscale')
        .mul(col('inverse_doc_frequency'))
        .mul(col('inverse_page_frequency'))
        .round(3)
        .alias('tf_idf_ipf_logscale'),
      col('term_occurrences_total')
        .div(col('term_occurrences_total').max().cast(Float64))
        .round(4)
        .alias('andre_score'),
    )
    .drop([
      'term_frequency',
      'term_frequency_logscale',
      'page_frequency',
      'comment_frequency',
      'inverse_doc_frequency',
      'inverse_page_frequency',
    ])
    .filter(col('comment_occurrences_total').gt(2))
    .sort('tf_idf', true);

  // filtering needs to be adjusted

  return tf_idf.toRecords() as WordRelevance[];
}

export const getScoringMap = (
  wordScores: WordRelevance[],
  scoringMethod: ScoringMethod,
) =>
  Object.fromEntries(
    wordScores.map((row) => [row['words'], row[scoringMethod]]),
  );

export function getCommentRelevanceScores(
  comments: IFeedback[],
  wordScores: WordRelevance[],
  normalizationStrength = 0.5,
) {
  const scoringMaps = Object.fromEntries(
    zip(
      scoringMethods.slice(),
      scoringMethods.map((method) => getScoringMap(wordScores, method)),
    ),
  );

  let highestWordCount = 0;

  const commentsWithScores = comments
    .map((comment) => {
      const scores: { [scoringMethod in ScoringMethod]: number | null } = {
        tf_idf: null,
        tf_idf_ipf: null,
        tf_idf_logscale: null,
        tf_idf_ipf_logscale: null,
        andre_score: null,
      };

      for (const method of scoringMethods) {
        const scoringMap = scoringMaps[method];

        const wordScores = comment.words
          ?.filter((word) => scoringMap[word])
          .map((word) => scoringMap[word]);

        if (wordScores?.length && wordScores.length > highestWordCount) {
          highestWordCount = wordScores.length;
        }

        // multiplty/divide by 100000 to avoid floating point arithmetic errors
        scores[method] =
          wordScores?.reduce(
            (a, b) => Math.round(a * 100000 + b * 100000) / 100000,
            0,
          ) ?? null;
      }

      const hasScores = Object.values(scores).find((score) => score !== null);

      if (!hasScores) {
        return null;
      }

      return {
        ...comment,
        ...scores,
      };
    })
    .filter((comment) => comment) as FeedbackWithScores[];

  // Normalization strength is a value between 0 and 1 -- to make it more intuitive
  // i.e. the normalization gets stronger as the number gets closer to 1
  // but for the calculation, the value is reversed (0 is the highest strength, 1 is the lowest strength)
  const normalizationConstant = 1 - normalizationStrength;

  // to normalize scores based on number of words
  // otherwise it's very biased towards longer comments
  const normalizationFactor = (wordCount: number) =>
    normalizationConstant +
    ((1 - normalizationConstant) * highestWordCount) / wordCount;

  const commentsWithNormalizedScores = commentsWithScores.map((comment) => {
    const wordCount = (<string[]>comment.words).length;

    const normalizedScores = Object.fromEntries(
      scoringMethods.map((method) => [`${method}_normalized`, null]),
    ) as {
      [method in NormalizedScoringMethod]: number | null;
    };

    for (const method of scoringMethods) {
      if (comment[method] !== null) {
        const normalizedMethod =
          `${method}_normalized` as NormalizedScoringMethod;

        const score = comment[method] as number;

        normalizedScores[normalizedMethod] = comment[method]
          ? // multiplty/divide by 1000 to avoid floating point arithmetic errors
            round(score * normalizationFactor(wordCount), 3)
          : null;
      }
    }

    return {
      ...comment,
      normalization_factor: round(normalizationFactor(wordCount), 3),
      ...normalizedScores,
    };
  });

  const maxScores = Object.fromEntries(
    scoringMethods.map((method) => [method, 0]),
  );

  const maxNormalizedScores = Object.fromEntries(
    scoringMethods.map((method) => [`${method}_normalized`, 0]),
  );

  for (const comment of commentsWithNormalizedScores) {
    for (const method of scoringMethods) {
      const score = comment[method] as number;

      if (score > maxScores[method]) {
        maxScores[method] = score;
      }

      const normalizedMethod =
        `${method}_normalized` as NormalizedScoringMethod;

      const normalizedScore = comment[normalizedMethod] as number;

      if (normalizedScore > maxNormalizedScores[normalizedMethod]) {
        maxNormalizedScores[normalizedMethod] = normalizedScore;
      }
    }
  }

  return commentsWithNormalizedScores.map((comment) => {
    for (const method of scoringMethods) {
      if (comment[method] !== null) {
        const score = comment[method] as number;

        comment[method] = comment[method]
          ? round(score / maxScores[method], 3)
          : null;

        const normalizedMethod =
          `${method}_normalized` as NormalizedScoringMethod;

        const normalizedScore = comment[normalizedMethod] as number;

        comment[normalizedMethod] = comment[normalizedMethod]
          ? round(normalizedScore / maxNormalizedScores[normalizedMethod], 3)
          : null;
      }
    }

    return comment as FeedbackWithScores;
  });
}

export function getAvgScore<T extends FeedbackWithScores | WordRelevance>(
  comment: T,
) {
  const scores = Object.entries(comment)
    .filter(
      ([key, score]) =>
        (<string[]>allScoringMethods).includes(key) && !isNullish(score),
    )
    .map(([, value]) => value);

  return scores.length ? avg(scores) : null;
}
