/*
 * Date utilities
 */

/**
 * Split a daterange string into an array containing startDate and endDate
 * @param dateRange 'YYYY-MM-DD/YYYY-MM-DD'
 * @return [startDate: Date, endDate: Date]
 *
 */
export const dateRangeSplit = (dateRange: string): Date[] =>
  dateRange.split('/').map((d) => new Date(d));
