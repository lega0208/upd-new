import { createReducer, on, Action } from '@ngrx/store';
import { zip } from 'rambdax';
import dayjs, { Dayjs, OpUnitType, QUnitType } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

import * as DateSelectionActions from './date-selection.actions';
import { DateRangePeriod, dateRangePeriods } from './date-selection.models';

dayjs.extend(utc);
dayjs.extend(quarterOfYear);

export type DateRange = {
  start: Dayjs;
  end: Dayjs;
};

export function datesFromDateRange(
  dateRange: DateRange,
  format: string | false = 'YYYY-MM-DD',
  inclusive = false
): Date[] | string[] {
  const dates: Dayjs[] = [];

  let currentDate = dayjs.utc(dateRange.start);

  const endDate = inclusive
    ? dayjs.utc(dateRange.end).add(1, 'day')
    : dayjs.utc(dateRange.end);

  while (!currentDate.isSame(endDate, 'day')) {
    dates.push(currentDate);
    currentDate = currentDate.add(1, 'day');
  }

  return format
    ? dates.map((date) => date.format(format))
    : dates.map((date) => date.toDate());
}

export const DATE_SELECTION_FEATURE_KEY = 'dateSelection';

export interface DateSelectionState {
  periodSelection: DateRangePeriod;
  dateRange: string;
  comparisonDateRange: string;
}

export interface DateSelectionPartialState {
  readonly [DATE_SELECTION_FEATURE_KEY]: DateSelectionState;
}

const initialPeriodSelection = 'weekly';

export const predefinedDateRanges = Object.fromEntries(
  dateRangePeriods.map((periodType) => [
    periodType,
    getPeriodDateRanges(periodType),
  ])
);

export const initialState: DateSelectionState = {
  // set initial required properties
  periodSelection: initialPeriodSelection,
  dateRange: predefinedDateRanges[initialPeriodSelection].dateRange,
  comparisonDateRange:
    predefinedDateRanges[initialPeriodSelection].comparisonDateRange,
};

const reducer = createReducer(
  initialState,
  on(DateSelectionActions.selectDatePeriod, (state, { selection }) => {
    const selectionData = predefinedDateRanges[selection];

    return {
      periodSelection: selection,
      dateRange: selectionData.dateRange,
      comparisonDateRange: selectionData.comparisonDateRange,
    };
  })
);

export function dateSelectionReducer(
  state: DateSelectionState | undefined,
  action: Action
) {
  return reducer(state, action);
}

export function getDateRangeFromPeriodType(periodType: DateRangePeriod) {
  const periodName = periodType.replace(/ly$/, '') as OpUnitType & QUnitType;

  const end = dayjs.utc().startOf(periodName).subtract(1, 'day');

  const start = end.subtract(1, 'day').startOf(periodName);

  return { start, end };
}

export function getPeriodDateRanges(periodType: DateRangePeriod) {
  const periodName = periodType.replace(/ly$/, '') as OpUnitType & QUnitType;
  const dateRange = getDateRangeFromPeriodType(periodType);

  const daysBetween = dateRange.end.diff(dateRange.start, 'days');

  const startDay = dateRange.start.day();

  const prevStart = dateRange.start
    .subtract(1, periodName)
    .startOf(periodName)
    .day(startDay); // align weekday

  const prevEnd = prevStart.add(daysBetween, 'days');

  const prevDateRange = {
    start: prevStart,
    end: prevEnd,
  };

  const prevDaysBetween = prevEnd.diff(prevStart, 'days');

  if (daysBetween !== prevDaysBetween) {
    throw new Error('days between dateRanges should be equal');
  }

  const currentDates = datesFromDateRange(
    dateRange,
    false,
    true
  ) as Date[];
  const prevDates = datesFromDateRange(
    prevDateRange,
    false,
    true
  ) as Date[];

  const dates = new Map(
    zip(
      prevDates.map((date) => date.toISOString()),
      currentDates.map((date) => date.toISOString()),
    ) as [string, string][]
  );

  const dateRangeString = `${dateRange.start.format(
    'YYYY-MM-DD'
  )}/${dateRange.end.format('YYYY-MM-DD')}`;

  const prevDateRangeString = `${prevDateRange.start.format(
    'YYYY-MM-DD'
  )}/${prevDateRange.end.format('YYYY-MM-DD')}`;

  return {
    dates,
    dateRange: dateRangeString,
    comparisonDateRange: prevDateRangeString,
  };
}
