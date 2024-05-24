import { Types } from 'mongoose';
import { avg, round } from '../math';
import { ITask, IUxTest, SuccessRates } from '@dua-upd/types-common';
import {
  Dictionary,
  filter,
  flatten,
  groupBy,
  keys,
  map,
  mapObject,
  pipe,
  piped,
  pluck,
  test,
  unwind,
} from 'rambdax';
import { isNullish } from '../utils-common';

export type DbEntity = {
  _id: Types.ObjectId;
};

/**
 * Gets the most recent test, or any with a success rate if no dates are present
 * @param uxTests
 */
export const getLatestTest = <T extends { date?: Date; success_rate?: number }>(
  uxTests: T[],
) =>
  uxTests.reduce(
    (latestTest, test) => {
      if (!latestTest || typeof latestTest?.date !== 'object') {
        return test;
      }

      if (!test.success_rate) {
        return latestTest;
      }

      if (test.date && test.date > latestTest.date) {
        return test;
      }

      return latestTest;
    },
    null as null | T,
  );

/**
 * Calculates the average success rate for a given array of UxTests
 * or returns null if no success rates are found.
 * @param uxTests
 */
export function getAvgTestSuccess<T extends { success_rate?: number }>(
  uxTests: T[],
) {
  const testsWithSuccessRate = uxTests
    .map((test) => test.success_rate)
    .filter(
      (successRate) => successRate !== undefined && successRate !== null,
    ) as number[];

  return avg(testsWithSuccessRate, 2);
}

/**
 *
 * @param uxTests Array of tests associated to a page/task/project
 */
export function getAvgSuccessFromLastTests<
  T extends { date?: Date; success_rate?: number; test_type?: string },
>(uxTests: T[]) {
  const uxTestsWithSuccessRate = uxTests.filter(
    (test) => test.success_rate ?? test.success_rate === 0,
  );

  const lastTest = getLatestTest(uxTestsWithSuccessRate);

  const lastTestDate: Date | null = lastTest?.date || null;

  const lastTests = lastTestDate
    ? uxTests.filter(
        (test) => test.date && test.date.getTime() === lastTestDate.getTime(),
      )
    : uxTests;

  const lastTestsByType = lastTests.reduce(
    (acc, test) => {
      if (!test.test_type) {
        return acc;
      }

      if (!(test.test_type in acc)) {
        acc[test.test_type] = [];
      }

      acc[test.test_type].push(test);

      return acc;
    },
    {} as { [key: string]: T[] },
  );

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
      [] as T[],
    ) || [];

  if (!allTests || !allTests.length) {
    return null;
  }

  return getAvgTestSuccess(allTests);
}

export function getAvgSuccessFromLatestTests<
  T extends { date?: Date; success_rate?: number },
>(uxTests: T[]): TestSuccessWithPercentChange & { latestDate: Date | null } {
  const sortedTests = [...uxTests]
    .filter(
      (test) =>
        test.date && test.success_rate != null && test.success_rate >= 0,
    )
    .sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime());

  if (sortedTests.length < 1)
    return {
      avgTestSuccess: null,
      latestDate: null,
      percentChange: null,
      total: 0,
    };

  const latestDate = sortedTests[0]?.date || null;
  const secondLatestDate = sortedTests.find(
    (test) => (test.date as Date).getTime() !== (latestDate as Date).getTime(),
  )?.date;

  const avgTestSuccess =
    getAvgTestSuccess(
      sortedTests.filter(
        (test) =>
          (test.date as Date).getTime() === (latestDate as Date).getTime(),
      ),
    ) ?? null;

  let avgSecondLatest = null;
  let percentChange = null;

  if (secondLatestDate) {
    avgSecondLatest =
      getAvgTestSuccess(
        sortedTests.filter(
          (test) =>
            (test.date as Date).getTime() ===
            (secondLatestDate as Date).getTime(),
        ),
      ) ?? null;
    percentChange =
      avgSecondLatest !== null
        ? (avgTestSuccess as number) - avgSecondLatest
        : null;
  }

  return {
    avgTestSuccess,
    latestDate,
    percentChange,
    total: sortedTests.length,
  };
}

export function groupTestsByType<
  T extends { date?: Date; success_rate?: number; test_type?: string },
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
    { None: [] } as { [key: string]: T[] },
  );
}

export function getAvgTestSuccessByDate<
  T extends { date?: Date; success_rate?: number; test_type?: string },
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
  total: number | null;
}

export function getLatestTestData<
  T extends { date?: Date; success_rate?: number; test_type?: string },
>(uxTests: T[]): TestSuccessWithPercentChange {
  const uxTestsWithSuccessRate = uxTests.filter(
    (test) => test.success_rate || test.success_rate === 0,
  );

  if (!uxTestsWithSuccessRate.length) {
    return {
      avgTestSuccess: null,
      percentChange: null,
      total: null,
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
            testsByType[previousTestType],
          );

          const percentChange =
            previousAvgTestSuccess !== null
              ? avgTestSuccess - previousAvgTestSuccess
              : null;

          return {
            avgTestSuccess,
            percentChange,
            total: testsByType[testType]?.length,
          };
        }
      }

      return {
        avgTestSuccess,
        percentChange: null,
        total: testsByType[testType]?.length,
      };
    }
  }

  return {
    avgTestSuccess: null,
    percentChange: null,
    total: null,
  };
}



export type ProjectTestTypes = {
  Baseline: IUxTest[];
  Validation: IUxTest[];
};
export const getImprovedKpiSuccessRates = (
  topTasks: ITask[],
  uxTests: IUxTest[],
): { uniqueTasks: number; successRates: SuccessRates } => {
const relevantUxTests = uxTests.filter(test => topTasks.some(task => task._id === test.tasks?.[0]));

  const groupByTaskByProjectByTestType = pipe(
    groupBy((test: IUxTest) => test!.tasks!.toString()), // group by task
    mapObject(groupBy((test: IUxTest) => test.project.toString())), // group by project
    // group by test type (group all non-validation test types as Baseline)
    mapObject(
      mapObject(
        groupBy(({ test_type }: IUxTest) =>
          test_type === 'Validation' ? 'Validation' : 'Baseline',
        ),
      ),
    ),
  );

  // filter bad stuff
  const filteredTests = relevantUxTests.filter(
    (test) =>
      !isNullish(test.success_rate) && test.test_type && test?.tasks?.length,
  );

  const avgTestSuccessRates = piped(
    filteredTests,
    // for tests with multiple tasks, unwind the tasks array
    map(unwind('tasks')),
    flatten,
    (tests: IUxTest[]) =>
      groupByTaskByProjectByTestType(tests) as Dictionary<
        Dictionary<ProjectTestTypes>
      >,
    // filter out projects with only 1 test type
    mapObject(
      filter(
        (projectTestTypes: any, testType: any) =>
          keys(projectTestTypes).length > 1,
      ),
    ),
    // filter out tasks with no projects
    filter((taskProjects: any, task: any) => keys(taskProjects).length > 0),
    // get the avg success rate for each test type
    mapObject<any>(
      mapObject(
        map(
          pipe(pluck('success_rate'), (successRates: unknown[]) =>
            avg(successRates as number[], 3),
          ),
        ),
      ),
    ),
    // calculate the difference between Baseline and Validation
    mapObject<any>(
      map((testTypes: any, project: any) => ({
        baseline: testTypes.Baseline,
        validation: testTypes.Validation,
        difference: round(testTypes.Validation - testTypes.Baseline, 4),
      })),
    ),

    // get avg of baseline, validation, and difference for each task over all projects
    mapObject((successRates: SuccessRates[]) => ({
      baseline: avg(pluck('baseline', successRates), 4) as number,
      validation: avg(pluck('validation', successRates), 4) as number,
      difference: avg(pluck('difference', successRates), 4) as number,
    })),
  );

  console.log(`number of tasks: ${keys(avgTestSuccessRates).length}`);

  const successRates = Object.values(avgTestSuccessRates);

  const overallAvgs = {
    baseline: avg(pluck('baseline', successRates), 4) as number,
    validation: avg(pluck('validation', successRates), 4) as number,
    difference: avg(pluck('difference', successRates), 4) as number,
  };

  return {
    uniqueTasks: keys(avgTestSuccessRates).length,
    successRates: overallAvgs,
  };
};


/*export const getImprovedKpiSuccessRatesForTopTasks = () => {
  // Select the top 50 tasks based on visits
  const top50Tasks = topTasks.slice(0, 50);

  // Adapt the rest of the function to work with top50Tasks instead of uxTests
  const groupByTaskByProjectByTestType = pipe(
    groupBy((task) => task.toString()), // group by task
    mapObject(groupBy((task) => task.portfolio.toString())), // group by project
    mapObject(
      mapObject(
        groupBy(({ test_type }) => test_type === 'Validation'? 'Validation' : 'Baseline'),
      ),
    ),
  );

  // Assuming top50Tasks is filtered to ensure it meets the criteria for being considered a "valid" task
  const filteredTasks = top50Tasks.filter(
    (task) => task.visits!== undefined && task.group && task.subgroup && task.portfolio,
  );

  const avgTaskSuccessRates = piped(
    filteredTasks,
    map(unwind('tasks')), // Assuming tasks is an array within each task object
    flatten,
    (tasks) => groupByTaskByProjectByTestType(tasks) as Dictionary<Dictionary<ProjectTestTypes>>,
    mapObject(filter((projectTestTypes: any, testType: any) => keys(projectTestTypes).length > 1)),
    filter((taskProjects: any, task: any) => keys(taskProjects).length > 0),
    mapObject(mapObject(map(pipe(pluck('success_rate'), (successRates: number[]) => avg(successRates as number[], 3))))),
    mapObject(map((testTypes: ProjectTestTypes) => ({
      baseline: testTypes.Baseline,
      validation: testTypes.Validation,
      difference: round(testTypes.Validation - testTypes.Baseline, 4),
    }))),
    mapObject((successRates: SuccessRates[]) => ({
      baseline: avg(pluck('baseline', successRates) as number[], 4),
      validation: avg(pluck('validation', successRates) as number[], 4),
      difference: avg(pluck('difference', successRates) as number[], 4),
    })),
  );

  console.log(`number of tasks: ${keys(avgTaskSuccessRates).length}`);

  const successRates = Object.values(avgTaskSuccessRates);




  
  const overallAvgs = {
    baseline: avg(pluck('baseline', successRates), 4) as number,
    validation: avg(pluck('validation', successRates), 4) as number,
    difference: avg(pluck('difference', successRates), 4) as number,
  };

  return {
    uniqueTasks: keys(avgTaskSuccessRates).length,
    successRates: overallAvgs,
  };
}; 

console.log(getImprovedKpiSuccessRatesForTopTasks()); */
  

/*export const getImprovedKpiSuccessRates2 = (
  uxTests: IUxTest[],
): { uniqueTasks: number; successRates: SuccessRates } => {
  // Sort tasks by success rate and select the top 50
  const top50Tasks = uxTests
   .filter((test) => !isNullish(test.success_rate) && test.test_type && test.tasks?.length)
   .flatMap((test) => test.tasks?.filter((task) => typeof task !== 'string' && 'success_rate' in task) ?? [])
   .sort((a, b) => ('success_rate' in a && 'success_rate' in b) ? b.success_rate - a.success_rate : 0)
   .slice(0, 50);

  const groupByTaskByProjectByTestType = pipe(
    groupBy((test: IUxTest) => test.tasks.toString()), // group by task
    mapObject(groupBy((test: IUxTest) => test.project.toString())), // group by project
    // group by test type (group all non-validation test types as Baseline)
    mapObject(
      mapObject(
        groupBy(({ test_type }: IUxTest) =>
          test_type === 'Validation'? 'Validation' : 'Baseline',
        ),
      ),
    ),
  );

  // Filter out tasks that are not in the top 50
  const filteredTests = uxTests.filter((test) =>
    top50Tasks.some((task) => task.id === (test.tasks ?? [])[0].id)
  );

  const avgTestSuccessRates = piped(
    filteredTests,
    // for tests with multiple tasks, unwind the tasks array
    map(unwind('tasks')),
    flatten,
    (tests: IUxTest[]) =>
      groupByTaskByProjectByTestType(tests) as Dictionary<
        Dictionary<ProjectTestTypes>
      >,
    // filter out projects with only 1 test type
    mapObject(
      filter(
        (projectTestTypes: any, testType: any) =>
          keys(projectTestTypes).length > 1,
      ),
    ),
    // filter out tasks with no projects
    filter((taskProjects: any, task: any) => keys(taskProjects).length > 0),
    // get the avg success rate for each test type
    mapObject<any>(
      mapObject(
        map(
          pipe(pluck('success_rate'), (successRates: unknown[]) =>
            avg(successRates as number[], 3),
          ),
        ),
      ),
    ),
    // calculate the difference between Baseline and Validation
    mapObject<any>(
      map((testTypes: any, project: any) => ({
        baseline: testTypes.Baseline,
        validation: testTypes.Validation,
        difference: round(testTypes.Validation - testTypes.Baseline, 4),
      })),
    ),

    // get avg of baseline, validation, and difference for each task over all projects
    mapObject((successRates: SuccessRates[]) => ({
      baseline: avg(pluck('baseline', successRates), 4) as number,
      validation: avg(pluck('validation', successRates), 4) as number,
      difference: avg(pluck('difference', successRates), 4) as number,
    })),
  );

  console.log(`number of tasks: ${keys(avgTestSuccessRates).length}`);

  const successRates = Object.values(avgTestSuccessRates);

  const overallAvgs = {
    baseline: avg(pluck('baseline', successRates), 4) as number,
    validation: avg(pluck('validation', successRates), 4) as number,
    difference: avg(pluck('difference', successRates), 4) as number,
  };

  return {
    uniqueTasks: keys(avgTestSuccessRates).length,
    successRates: overallAvgs,
  };*/