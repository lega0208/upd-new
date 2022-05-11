/*
 * Date utilities
 */

export const dateRangeSplit = (dateRange: string): Date[] =>
  dateRange.split('/').map((d) => new Date(d));
