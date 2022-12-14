/*
 * For mathematical functions that could be used in multiple projects
 */

export const percentChange = (currentValue: number, previousValue: number) =>
  (currentValue - previousValue) / previousValue;

export const sum = (array: number[]) =>
  array.reduce((total, term) => term + total, 0);
