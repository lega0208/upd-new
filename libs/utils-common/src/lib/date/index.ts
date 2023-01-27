import _dayjs, {
  Dayjs as _Dayjs,
  OpUnitType as _OpUnitType,
  QUnitType as _QUnitType,
} from 'dayjs';
import utc from 'dayjs/plugin/utc';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import duration, { DurationUnitType } from 'dayjs/plugin/duration';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';
import { partial } from 'rambdax';

_dayjs.extend(utc);
_dayjs.extend(quarterOfYear);
_dayjs.extend(duration);

// Re-export dayjs object and types to be able to import from here
export const dayjs = _dayjs;
export type Dayjs = _Dayjs;
export type OpUnitType = _OpUnitType;
export type QUnitType = _QUnitType;

export type AbstractDate = string | Date | Dayjs;

export type DateRange<T extends AbstractDate> = {
  start: T;
  end: T;
};

export function datesFromDateRange(
  dateRange: DateRange<Dayjs>,
  format: string | false = 'YYYY-MM-DD',
  inclusive = false
): Date[] | string[] {
  const dates: Dayjs[] = [];

  let currentDate = dayjs.utc(dateRange.start);

  const endDate = inclusive
    ? dayjs.utc(dateRange.end).add(1, 'day')
    : dayjs.utc(dateRange.end);

  if (endDate.isBefore(currentDate)) {
    throw Error('Invalid dateRange - end is before start');
  }

  while (!currentDate.isSame(endDate, 'day')) {
    dates.push(currentDate);
    currentDate = currentDate.add(1, 'day');
  }

  return format
    ? dates.map((date) => date.format(format))
    : dates.map((date) => date.toDate());
}

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
  const localDate = dayjs.utc(date).local().date();
  const utcDate = dayjs.utc(date).date();
  const datesAreDifferent = localDate !== utcDate;

  const datejs = dayjs(date);

  return datejs.isUTC() && datesAreDifferent
    ? datejs.subtract(1, 'day').startOf('day')
    : datejs;
};

export const startOfDay = (date: string | Date | Dayjs) =>
  dayjs(date).startOf('day');

export const today = () => startOfDay(normalizeUTCDate(dayjs.utc()));

/*
 * For calculating different types of dynamic date ranges,
 * based on current date:
 */

export const dateRangeTypes = [
  'week',
  'month',
  'quarter',
  'year',
  'fiscal_year',
  'last_52_weeks',
  'year_to_date',
] as const;

export type DateRangeType = typeof dateRangeTypes[number];

export interface DateRangeConfig {
  type: DateRangeType;
  label: string;
  getDateRange: (fromDate?: AbstractDate) => DateRange<Dayjs>;
  getComparisonDate: (fromDate?: AbstractDate) => Dayjs;
}

// For "generic" date range types, i.e. last week/month/quarter/year, + previous
export const getPeriodDateRange = (
  periodName: OpUnitType | QUnitType,
  fromDate: AbstractDate = today()
) => {
  const end = dayjs.utc(fromDate).startOf(periodName).subtract(1, 'day');

  return {
    start: end.subtract(1, 'day').startOf(periodName),
    end,
  } as DateRange<Dayjs>;
};

export const getComparisonDate = (
  [periodName]: OpUnitType | QUnitType,
  fromDate: AbstractDate = today()
) => {
  // Convert duration to weeks for weekday alignment
  // Need to use Math.floor or else:
  //  1 month is 4.285714285714286 weeks,
  //  1 year 52.14285714... etc.
  const numWeeks = Math.floor(
    dayjs.duration(1, periodName as DurationUnitType).asWeeks()
  );

  return dayjs.utc(fromDate).subtract(numWeeks, 'weeks');
};

const genericPeriods = Object.fromEntries<DateRangeConfig>((
  ['week', 'month', 'year'] as const
).map((type) => [type, {
  type,
  label: `Last ${type}`,
  getDateRange: partial(getPeriodDateRange, [type]),
  getComparisonDate: partial(getComparisonDate, [type]),
}]));

const quarterlyConfig: DateRangeConfig =
  {
    type: 'quarter',
    label: 'Last quarter',
    getDateRange: partial(getPeriodDateRange, ['quarter']),
    getComparisonDate: function(fromDate = today()) {
      const numWeeks = Math.floor(dayjs.duration(3, 'months').asWeeks());

      const sevenDaysAfterCurrentStart = this.getDateRange(fromDate).start.add(7, 'days');

      const comparisonDate = dayjs.utc(fromDate).subtract(numWeeks, 'weeks');

      if (!comparisonDate.isBefore(sevenDaysAfterCurrentStart)) {
        return comparisonDate.subtract(1, 'weeks');
      }

      return comparisonDate;
    }
  }

export const dateRangeConfigs: readonly DateRangeConfig[] = Object.freeze([
  genericPeriods['week'],
  genericPeriods['month'],
  quarterlyConfig,
  genericPeriods['year'],
  {
    type: 'fiscal_year',
    label: 'Last fiscal year',
    getDateRange: (fromDate = today()) => {
      const datejs = dayjs.utc(fromDate);

      const currentYearEnd = datejs.month(2).endOf('month').startOf('day');

      const endIsPreviousYear = currentYearEnd.isAfter(datejs);

      const end = endIsPreviousYear
        ? currentYearEnd.subtract(1, 'year')
        : currentYearEnd;

      return {
        start: end.subtract(1, 'year').add(1, 'day'),
        end,
      };
    },
    getComparisonDate: (fromDate = today()) =>
      dayjs.utc(fromDate).subtract(52, 'weeks'),
  },
  {
    type: 'last_52_weeks',
    label: 'Last 52 weeks',
    getDateRange: (fromDate = today()) => {
      const end = dayjs.utc(fromDate).startOf('week').subtract(1, 'day');
      const start = end.subtract(1, 'year').add(1, 'day');

      return { start, end };
    },
    getComparisonDate: (fromDate = today()) =>
      dayjs.utc(fromDate).subtract(52, 'weeks'),
  },
  {
    type: 'year_to_date',
    label: 'Year to date',
    getDateRange: (fromDate = today()) => {
      const end = dayjs.utc(fromDate).subtract(1, 'day');
      const start = end.startOf('year');

      return { start, end };
    },
    getComparisonDate: (fromDate = today()) =>
      dayjs.utc(fromDate).subtract(52, 'weeks'),
  },
]);
