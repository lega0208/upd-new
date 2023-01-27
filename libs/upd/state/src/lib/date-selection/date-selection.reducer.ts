import { createReducer, on, Action } from '@ngrx/store';
import { zip } from 'rambdax';
import {
  DateRange,
  Dayjs,
  DateRangeType,
  DateRangeConfig,
  dateRangeConfigs,
  datesFromDateRange,
} from '@dua-upd/utils-common';

import * as DateSelectionActions from './date-selection.actions';

export interface DateRangePeriod {
  type: DateRangeType;
  // translation key for dropdown label
  label: string;
  dateRange: DateRange<Dayjs>;
  comparisonDateRange: DateRange<Dayjs>;
  // Maps comparison dates to current dates (both as ISOString)
  dates: Map<string, string>;
}

export const DATE_SELECTION_FEATURE_KEY = 'dateSelection';

export interface DateSelectionState {
  periodSelection: DateRangeType;
  dateRange: string;
  comparisonDateRange: string;
}

export interface DateSelectionPartialState {
  readonly [DATE_SELECTION_FEATURE_KEY]: DateSelectionState;
}

export const predefinedDateRanges = Object.fromEntries(
  dateRangeConfigs.map((config) => [
    config.type,
    createPredefinedDateRange(config),
  ])
);

const initialPeriodSelection = predefinedDateRanges['week'];
export const initialState: DateSelectionState = {
  // set initial required properties
  periodSelection: initialPeriodSelection.type,
  dateRange: toDateRangeString(initialPeriodSelection.dateRange),
  comparisonDateRange: toDateRangeString(
    initialPeriodSelection.comparisonDateRange
  ),
};

const reducer = createReducer(
  initialState,
  on(
    DateSelectionActions.selectDatePeriod,
    (state, { selection }): DateSelectionState => {
      const selectedPeriod = predefinedDateRanges[selection];

      return {
        periodSelection: selection,
        dateRange: toDateRangeString(selectedPeriod.dateRange),
        comparisonDateRange: toDateRangeString(
          selectedPeriod.comparisonDateRange
        ),
      };
    }
  )
);

export function dateSelectionReducer(
  state: DateSelectionState | undefined,
  action: Action
) {
  return reducer(state, action);
}

export function createPredefinedDateRange(
  config: DateRangeConfig
): DateRangePeriod {
  const dateRange = config.getDateRange();

  const daysBetween = dateRange.end.diff(dateRange.start, 'days');

  const comparisonDateRange = {
    start: config.getComparisonDate(dateRange.start),
    end: config.getComparisonDate(dateRange.end),
  };

  const prevDaysBetween = comparisonDateRange.end.diff(
    comparisonDateRange.start,
    'days'
  );

  if (daysBetween !== prevDaysBetween) {
    throw Error('days between dateRanges should be equal');
  }

  const currentDates = datesFromDateRange(dateRange, false, true) as Date[];
  const prevDates = datesFromDateRange(
    comparisonDateRange,
    false,
    true
  ) as Date[];

  const dates = new Map(
    zip(
      prevDates.map((date) => date.toISOString()),
      currentDates.map((date) => date.toISOString())
    ) as [string, string][]
  );

  return {
    type: config.type,
    label: config.label,
    dateRange,
    comparisonDateRange,
    dates,
  };
}

export function toDateRangeString(dateRange: DateRange<Dayjs>) {
  return `${dateRange.start.format('YYYY-MM-DD')}/${dateRange.end.format(
    'YYYY-MM-DD'
  )}`;
}
