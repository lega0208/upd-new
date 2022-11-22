/*
 * Date utilities
 */

import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Split a daterange string into an array containing startDate and endDate
 * @param dateRange 'YYYY-MM-DD/YYYY-MM-DD'
 * @return [startDate: Date, endDate: Date]
 *
 */
export const dateRangeSplit = (dateRange: string): Date[] =>
  dateRange.split('/').map((d) => new Date(d));

/**
 * Utility for correcting UTC dates if they're off by 1 (for calculating what "today" is)
 *  (i.e. when "today" in UTC is actually "tomorrow" in the local timezone)
 * @param date
 */
export const normalizeUTCDate = (date: Date | string | Dayjs) => {
  const localDate = dayjs().date();
  const utcDate = dayjs.utc().date();
  const datesAreDifferent = localDate !== utcDate;

  const datejs = dayjs(date);

  return datejs.isUTC() && datesAreDifferent
    ? datejs.subtract(1, 'day').startOf('day')
    : datejs;
};

export const startOfDay = (date: string | Date | Dayjs) =>
  dayjs(date).startOf('day');

export const today = () => startOfDay(normalizeUTCDate(dayjs.utc()));
