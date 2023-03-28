import chalk from 'chalk';

// Utility function for to help with rate-limiting within async functions
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Removes double-spaces and trims the string
export function squishTrim<T extends string>(str?: T) {
  return (str?.replaceAll(/\s{2,}/g, ' ').trim() as T) || '';
}

export const hasDuplicates = <T>(array: T[]) =>
  array.length !== 0 && new Set(array).size !== array.length;

// Used for measuring function execution time
//  -credit: https://leefreeman.xyz/2020/05/08/typescript-decorators/
export function LogTiming(message = '') {
  return function (
    target: object,
    name: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    descriptor.value = async function () {
      const startTime = new Date(Date.now());
      await method.apply(this);
      const endTime = new Date(Date.now());
      console.log(
        `${message || name} took ${
          endTime.getTime() - startTime.getTime()
        }ms to complete.`
      );
    };
  };
}

export const AsyncLogTiming = <T extends (...args: unknown[]) => ReturnType<T>>(
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => {
  const originalMethod: T = descriptor.value;

  descriptor.value = async function (...args: Parameters<T>) {
    const start = Date.now();
    const result = await originalMethod.apply(this, args);
    const finish = Date.now();
    console.log(
      `${propertyKey} Execution time: ${
        Math.round((finish - start) / 10) / 100
      } seconds`
    );
    return result;
  };

  return descriptor;
};

// Decorator for setting an Input field as required
export function Required(target: object, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    get() {
      throw new Error(`Attribute ${propertyKey} is required`);
    },
    set(value) {
      Object.defineProperty(target, propertyKey, {
        value,
        writable: true,
        configurable: true,
      });
    },
    configurable: true,
  });
}

type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

/**
 * Converts an array of objects into a "dictionary" or lookup table, using the value of the specified property as the key
 *
 * Helps with performance when searching nested properties of large arrays of objects
 *
 * @param array The array to convert
 * @param keyProp The property to use as keys
 * @param allowDuplicateKeys Will throw an error if a duplicate key is found by default
 *
 * @example
 * const arrayOfObjects = [{ prop1: 'a string', ... }];
 * // Say I need to check a bunch of strings against my array
 * const aBunchOfStrings ['Wow', 'look', *'a string'*, 'and another'];
 *
 * // I could use Array.find() and do a full search for every string, or...
 *
 * const objectDictionary = arrayToDictionary(arrayOfObjects, 'prop1'); // { 'a string': { ... } }
 *
 * // oh boy i hope i find an object with 'a string' as prop1
 * for (const potentialMatch of aBunchOfStrings) {
 *   const match = objectDictionary[potentialMatch];
 *
 *   if (match) {
 *     console.log(match);
 *     // {
 *     //   prop1: 'a string',
 *     //   ...
 *     // }
 *   }
 * }
 *
 */
export function arrayToDictionary<T extends object>(
  array: T[],
  keyProp: keyof T,
  allowDuplicateKeys = false
) {
  if (!array.length) return {};

  const dictionary: Record<string, T> = {};

  for (const obj of array) {
    const key = `${obj[keyProp]}`;

    if (!key) {
      throw Error(
        'Could not convert array to dictionary: the value of the key property is invalid or undefined.\r\n' +
          'Object where error occurred:\r\n\r\n' +
          JSON.stringify(obj, null, 2)
      );
    }

    if (!allowDuplicateKeys && dictionary[key]) {
      throw Error(
        'Could not convert array to dictionary: received duplicate key: ' + key
      );
    }

    dictionary[key] = obj;
  }

  return dictionary;
}

// For cloning class instances, objects, etc., including current state
export const clone = <T extends object>(obj: T): T =>
  Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);

/**
 * Because I was getting tired of re-typing 'console.log(JSON.stringify(anything, null, 2))' over and over
 * @param anything - The value to log
 * @param logger - Optional custom logger (though honestly why not just add this to the custom logger?)
 */
export function logJson(anything: unknown, logger = console.log) {
  logger(JSON.stringify(anything, null, 2));
}

// For logging JSON
export function prettyJson(obj: object) {
  return JSON.stringify(obj, null, 2);
}

/**
 * It takes an array of objects from AA, and returns an array of arrays, where each array is a group of objects
 * @param {{ data: number[]; value: string }[]} arr - The array of objects that you want to seperate.
 * @returns An array of arrays of objects.
 */
export function seperateArray(arr: { data: number[]; value: string }[]) {
  const newArrays: { data: number; value: string }[][] = [];

  for (let i = 0; i < arr.length; i++) {
    const current_row = arr[i];
    for (let j = 0; j < current_row.data.length; j++) {
      const current_data = current_row.data[j];

      if (newArrays[j] === undefined) {
        newArrays[j] = [];
      }

      if (current_data === 0) {
        continue;
      }

      newArrays[j].push({
        data: current_data,
        value: current_row.value,
      });
    }
  }

  return newArrays;
}

/**
 * It sorts an array of arrays of objects by the data property in descending order
 * @param {{ data: number; value: string }[][]} arr - The array to be sorted.
 * @returns the sorted array.
 */
export function sortArrayDesc(arr: { data: number; value: string }[][]) {
  arr.forEach((e) => {
    e.sort((a, b) => {
      return b.data - a.data;
    });
  });

  return arr;
}

/**
 * Performs async processing in batches of a given size, with
 * an optional delay between calls to handle rate-limiting.
 * @param paramsArray - The array of parameters which will each individually be passed to the function.
 * @param fn - The async function to be called on each item.
 * @param batchSize - The maximum number of concurrent calls that can be pending.
 * @param delay - Can be a number for constant delay or an object for dynamic delay.
 */
export async function batchAwait<T, U>(
  paramsArray: T[],
  fn: (param: T) => Promise<U>,
  batchSize: number,
  delay: number | { delay: number } = 0
): Promise<U[]> {
  const promises = [];

  for (const params of paramsArray) {
    const promise = fn(params);
    promises.push(promise);

    const currentDelay = typeof delay === 'number' ? delay : delay.delay;

    if (promises.length !== 0 && promises.length % batchSize === 0) {
      await Promise.all([...promises, wait(currentDelay)]);
    } else {
      await wait(currentDelay);
    }
  }

  return Promise.all(promises);
}

/**
 * Maps over chunks of an array rather than individual items
 * @param array Array to map over
 * @param mapFunc Map function
 * @param chunkSize Size of chunks
 */
export function chunkMap<T, ReturnT>(
  array: T[],
  mapFunc: (val: T[]) => ReturnT,
  chunkSize: number
): ReturnT[] {
  const chunks = [];

  while (array.length) {
    chunks.push(mapFunc(array.splice(0, chunkSize)));
  }

  return chunks;
}

// Thanks ChatGPT
export class TimingUtility {
  private previousIterationEndTime = Date.now();
  private iterationDurations: number[] = [];
  private iterationCount = 0;
  private averageDuration = 1500;

  constructor(private totalIterations: number) {}

  private calculateAverage(): void {
    const sum = this.iterationDurations.reduce(
      (total, duration) => total + duration,
      0
    );
    this.averageDuration = sum / this.iterationDurations.length;
  }

  private formatTimeRemaining(milliseconds: number): string {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = (seconds / 60).toFixed(2);
    return seconds > 60
      ? `${minutes} minute${seconds < 120 ? '' : 's'}`
      : `${seconds} second${seconds === 1 ? '' : 's'}`;
  }

  private formatIterationCount() {
    const lessThan10 = this.iterationCount < 10 ? '0' : '';
    const lessThan100 = this.iterationCount < 100 ? '0' : '';
    return `${lessThan10}${lessThan100}${this.iterationCount}`;
  }

  public logIteration(customMessage?: string): void {
    const iterationStartTime = Date.now();
    const iterationDuration =
      iterationStartTime - this.previousIterationEndTime;
    this.iterationDurations.push(iterationDuration);
    this.iterationCount++;
    this.calculateAverage();
    const timeRemaining = this.formatTimeRemaining(
      (this.totalIterations - this.iterationCount) * this.averageDuration
    );
    const message =
      `${chalk.green('✔')}  ${chalk.dim(new Date().toLocaleTimeString())} | ` +
      `${chalk.bold(this.formatIterationCount())}: ${chalk.yellow(
        `${iterationDuration}ms`
      )} | ` +
      `${chalk.blue(`Average: ${this.averageDuration.toFixed(2)}ms`)} | ` +
      `${chalk.magenta(`Time remaining: ${timeRemaining}`)} | ${
        customMessage || ''
      }\r`;
    console.log(message);
    this.previousIterationEndTime = Date.now();
  }
}
