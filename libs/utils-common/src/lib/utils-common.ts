// Utility function for to help with rate-limiting within async functions
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Removes double-spaces and trims the string
export function squishTrim<T extends string>(str?: T) {
  return str?.replace(/\s+/g, ' ') as T || '';
}

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
  delay: number | { delay: number; } = 0,
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
