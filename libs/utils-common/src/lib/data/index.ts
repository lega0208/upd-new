import { Model } from 'mongoose';
import { FeedbackComment, FeedbackDocument, UxTest } from '@cra-arc/types-common';
import { dateRangeSplit } from '../date';

/**
 * Gets the most recent test, or any with a success rate if no dates are present
 * @param uxTests
 */
export const getLatestTest = (uxTests: Partial<UxTest>[]) =>
  uxTests.reduce((latestTest, test) => {
    if (!latestTest || typeof latestTest?.date !== 'object') {
      return test;
    }

    if (test.date && test.date > latestTest.date) {
      return test;
    }

    return latestTest;
  }, null as null | Partial<UxTest>);

/**
 * Calculates the average success rate for a given array of UxTests
 * or returns null if no success rates are found.
 * @param uxTests
 */
export function getAvgTestSuccess(uxTests: Partial<UxTest>[]) {
  const testsWithSuccessRate = uxTests
    .map((test) => test.success_rate)
    .filter(
      (successRate) => successRate !== undefined && successRate !== null
    ) as number[];

  if (testsWithSuccessRate.length > 0) {
    return (
      testsWithSuccessRate.reduce(
        (total, success_rate) => total + success_rate,
        0
      ) / uxTests.length
    );
  }

  return null;
}

/**
 *
 * @param uxTests Array of tests associated to a page/task/project
 */
export function getAvgSuccessFromLastTests(uxTests: Partial<UxTest>[]) {
  const lastTest = getLatestTest(uxTests);

  const lastTestDate: Date | null = lastTest?.date || null;

  const lastTests = lastTestDate
    ? uxTests.filter(
        (test) => test.date && test.date.getTime() === lastTestDate.getTime()
      )
    : uxTests;

  const lastTestsByType = lastTests.reduce((acc, test) => {
    if (!test.test_type) {
      return acc;
    }

    if (!(test.test_type in acc)) {
      acc[test.test_type] = [];
    }

    acc[test.test_type].push(test);

    return acc;
  }, {} as { [key: string]: Partial<UxTest>[] });

  const testTypes = Object.keys(lastTestsByType);

  if (testTypes.length === 0) {
    return null;
  }

  // If there are validation tests, take these as the "latest test"
  if ('Validation' in lastTestsByType) {
    const avgSuccess = getAvgTestSuccess(lastTestsByType['Validation']);

    if (avgSuccess) {
      return avgSuccess;
    }
  }

  // Otherwise use baseline tests
  if ('Baseline' in lastTestsByType) {
    const avgSuccess = getAvgTestSuccess(lastTestsByType['Baseline']);

    if (avgSuccess) {
      return avgSuccess;
    }
  }

  // If no validation or baseline tests, use whatever we have
  const allTests =
    testTypes.reduce(
      (acc, key) => acc.concat(lastTestsByType[key]),
      [] as Partial<UxTest>[]
    ) || [];

  if (!allTests || !allTests.length) {
    return null;
  }

  return getAvgTestSuccess(allTests);
}

/**
 *
 * @param dateRange
 * @param pageUrls
 * @param feedbackModel
 */
export async function getFeedbackComments(
  dateRange: string,
  pageUrls: string[],
  feedbackModel: Model<FeedbackDocument>
): Promise<FeedbackComment[]> {
  const [startDate, endDate] = dateRangeSplit(dateRange);

  return (
    (await feedbackModel.find({
      url: { $in: pageUrls },
      date: { $gte: startDate, $lte: endDate },
    })) || []
  ).map((feedback) => ({
    date: feedback.date,
    url: feedback.url,
    tag: feedback.tags?.length ? feedback.tags[0] : '',
    whats_wrong: feedback.whats_wrong || '',
    comment: feedback.comment,
  }));
}

export async function getFeedbackByTags(
  dateRange: string,
  urls: string[],
  feedbackModel: Model<FeedbackDocument>
) {
  const [startDate, endDate] = dateRangeSplit(dateRange);

  return feedbackModel
    .aggregate<{ tag: string; numComments: number }>()
    .match({
      url: { $in: urls },
      date: { $gte: startDate, $lte: endDate },
    })
    .unwind('$tags')
    .group({
      _id: '$tags',
      numComments: { $sum: 1 },
    })
    .project({
      _id: 0,
      tag: '$_id',
      numComments: 1,
    });
}
