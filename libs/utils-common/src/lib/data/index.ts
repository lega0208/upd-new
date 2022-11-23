import { Types } from 'mongoose';

export type DbEntity = {
  _id: Types.ObjectId;
};

/**
 * Gets the most recent test, or any with a success rate if no dates are present
 * @param uxTests
 */
export const getLatestTest = <T extends { date?: Date }>(uxTests: T[]) =>
  uxTests.reduce((latestTest, test) => {
    if (!latestTest || typeof latestTest?.date !== 'object') {
      return test;
    }

    if (test.date && test.date > latestTest.date) {
      return test;
    }

    return latestTest;
  }, null as null | T);

/**
 * Calculates the average success rate for a given array of UxTests
 * or returns null if no success rates are found.
 * @param uxTests
 */
export function getAvgTestSuccess<T extends { success_rate?: number }>(
  uxTests: T[]
) {
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
      ) / testsWithSuccessRate.length
    );
  }

  return null;
}

/**
 *
 * @param uxTests Array of tests associated to a page/task/project
 */
export function getAvgSuccessFromLastTests<
  T extends { date?: Date; success_rate?: number; test_type?: string }
>(uxTests: T[]) {
  const uxTestsWithSuccessRate = uxTests.filter(
    (test) => test.success_rate ?? test.success_rate === 0
  );

  const lastTest = getLatestTest(uxTestsWithSuccessRate);

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
  }, {} as { [key: string]: T[] });

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
      [] as T[]
    ) || [];

  if (!allTests || !allTests.length) {
    return null;
  }

  return getAvgTestSuccess(allTests);
}

export function groupTestsByType<
  T extends { date?: Date; success_rate?: number; test_type?: string }
>(uxTests: T[]) {
  return uxTests.reduce(
    (testsByType, test) => {
      if (!test.test_type) {
        testsByType['None'].push(test);

        return testsByType;
      }

      if (!(test.test_type in testsByType)) {
        testsByType[test.test_type] = [];
      }

      testsByType[test.test_type].push(test);

      return testsByType;
    },
    { None: [] } as { [key: string]: T[] }
  );
}

export function getAvgTestSuccessByDate<
  T extends { date?: Date; success_rate?: number; test_type?: string }
>(uxTests: T[]) {
  const testsByDate: { [date: string]: T[] } = { None: [] };

  for (const test of uxTests) {
    if (!test.date) {
      testsByDate['None'].push(test);
      continue;
    }

    const date = test.date.toISOString();

    if (!testsByDate[date]) {
      testsByDate[date] = [];
    }

    testsByDate[date].push(test);
  }

  const dates = Object.keys(testsByDate);

  const avgSuccessRateByDate: Record<string, number | null> = {};

  for (const date of dates) {
    avgSuccessRateByDate[date] = getAvgTestSuccess(testsByDate[date]);
  }

  return avgSuccessRateByDate;
}

export interface TestSuccessWithPercentChange {
  avgTestSuccess: number | null;
  percentChange: number | null;
}

export function getLatestTestData<
  T extends { date?: Date; success_rate?: number; test_type?: string }
>(uxTests: T[]): TestSuccessWithPercentChange {
  const uxTestsWithSuccessRate = uxTests.filter(
    (test) => test.success_rate || test.success_rate === 0
  );

  if (!uxTestsWithSuccessRate.length) {
    return {
      avgTestSuccess: null,
      percentChange: null,
    };
  }

  const testsByType = groupTestsByType(uxTestsWithSuccessRate);

  const testTypesByPriority = [
    'Validation',
    'Baseline',
    'Exploratory',
    'Spot Check',
    'None',
  ];

  while (testTypesByPriority.length > 0) {
    const testType = testTypesByPriority.splice(0, 1)[0];

    if (testsByType[testType]?.length) {
      const avgTestSuccess = getAvgTestSuccess(testsByType[testType]);

      if (avgTestSuccess === null) {
        continue;
      }

      while (testTypesByPriority.length > 0) {
        const previousTestType = testTypesByPriority.splice(0, 1)[0];

        if (testsByType[previousTestType]) {
          const previousAvgTestSuccess = getAvgTestSuccess(
            testsByType[previousTestType]
          );

          const percentChange =
            previousAvgTestSuccess !== null
              ? avgTestSuccess - previousAvgTestSuccess
              : null;

          return {
            avgTestSuccess,
            percentChange,
          };
        }
      }

      return {
        avgTestSuccess,
        percentChange: null,
      };
    }
  }

  return {
    avgTestSuccess: null,
    percentChange: null,
  };
}
