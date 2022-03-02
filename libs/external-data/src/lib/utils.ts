// Utilities for timeouts, retries, and request throttling, etc.

import { DateRange } from './types';
import dayjs from 'dayjs';

export const withTimeout = <T>(
  fn: () => Promise<T>,
  timeout
): (() => Promise<T>) => {
  return () =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Function ${fn.name} timed out`));
      }, timeout);

      fn().then(
        (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
};

export const withRetry = (fn, retries, delay) => {
  return () =>
    new Promise((resolve, reject) => {
      const attempt = (retries, delay) => {
        fn().then(
          (result) => {
            resolve(result);
          },
          (err) => {
            if (retries > 0) {
              setTimeout(() => {
                attempt(retries - 1, delay);
              }, delay);
            } else {
              reject(err);
            }
          }
        );
      };

      attempt(retries, delay);
    });
};

// can't use right now because of how the timeout function had to be implemented
export const withResilience = (fn, options = {}) => {
  const opts = {
    retries: 3,
    delay: 500,
    timeout: 15000,
    ...options,
  };

  return withRetry(withTimeout(fn, opts.timeout), opts.retries, opts.delay);
};

// not currently working... all promises run after the first batch for some reason
export function withRateLimit<T, U extends unknown[]>(
  func: (...args: U) => Promise<T>,
  numCallsPerSecond: number
) {
  const active = { count: 0 };

  func = func.bind(this);

  async function waitForQueue(...args: U) {
    active.count++;
    const result = await func(...args);
    console.log('complete!');
    active.count--;

    return result;
  }

  return async function (...args: U) {
    while (active.count >= numCallsPerSecond) {
      console.log('waiting...');
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 / numCallsPerSecond)
      );
    }

    return await waitForQueue(...args);
  };
}

// For GSC or AA page queries, because they're only done on individual dates
export function datesFromDateRange(dateRange: DateRange, format = 'YYYY-MM-DD') {
  const dates = [];
  let currentDate = dayjs(dateRange.start);
  const endDate = dayjs(dateRange.end);

  // doesn't include end date, which is what we want because AA date range doesn't include the end date
  while (!currentDate.isSame(endDate, 'day')) {
    dates.push(currentDate.format(format));
    currentDate = currentDate.add(1, 'day');
  }

  return dates;
}
