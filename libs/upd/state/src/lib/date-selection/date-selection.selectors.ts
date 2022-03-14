import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  DATE_SELECTION_FEATURE_KEY,
  DateSelectionState,
} from './date-selection.reducer';

// Lookup the 'DateSelection' feature state managed by NgRx
export const getDateSelectionState = createFeatureSelector<DateSelectionState>(
  DATE_SELECTION_FEATURE_KEY
);

export const getDatePeriodSelection = createSelector(
  getDateSelectionState,
  (state: DateSelectionState) => state.periodSelection
);

export const getDateRanges = createSelector(
  getDateSelectionState,
  (state: DateSelectionState) => ({
    dateRange: state.dateRange,
    comparisonDateRange: state.comparisonDateRange,
  })
);
