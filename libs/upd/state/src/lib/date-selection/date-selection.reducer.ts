import { createReducer, on, Action } from '@ngrx/store';

import dayjs, { OpUnitType, QUnitType } from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

import * as DateSelectionActions from './date-selection.actions';
import { DateRangePeriod } from './date-selection.models';

dayjs.extend(quarterOfYear);

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

export const initialState: DateSelectionState = {
  // set initial required properties
  periodSelection: initialPeriodSelection,
  dateRange: getDateRangeFromPeriodType(initialPeriodSelection),
  comparisonDateRange: getDateRangeFromPeriodType(initialPeriodSelection, true),
};

const reducer = createReducer(
  initialState,
  on(DateSelectionActions.selectDatePeriod, (state, { selection }) => ({
    periodSelection: selection,
    dateRange: getDateRangeFromPeriodType(selection),
    comparisonDateRange: getDateRangeFromPeriodType(selection, true),
  })),
);

export function dateSelectionReducer(
  state: DateSelectionState | undefined,
  action: Action
) {
  return reducer(state, action);
}

export function getDateRangeFromPeriodType(periodType: DateRangePeriod, previous = false) {
  const periodName = periodType.replace(/ly$/, '') as OpUnitType & QUnitType;

  let endDate = dayjs().startOf(periodName).subtract(1, 'day');

  let startDate = endDate.subtract(1, 'day').startOf(periodName);

  if (previous) {
    endDate = endDate.subtract(1, periodName).endOf(periodName);
    startDate = startDate.subtract(1, periodName);
  }

  return `${startDate.format('YYYY-MM-DD')}/${endDate.format('YYYY-MM-DD')}`;
}
