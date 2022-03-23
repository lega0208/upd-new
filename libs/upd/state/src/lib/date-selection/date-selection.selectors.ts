import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  DATE_SELECTION_FEATURE_KEY,
  DateSelectionState,
} from './date-selection.reducer';

// Lookup the 'DateSelection' feature state managed by NgRx
export const selectDateSelectionState = createFeatureSelector<DateSelectionState>(
  DATE_SELECTION_FEATURE_KEY
);

export const selectDatePeriodSelection = createSelector(
  selectDateSelectionState,
  (state: DateSelectionState) => state.periodSelection
);

export const selectDateRanges = createSelector(
  selectDateSelectionState,
  (state: DateSelectionState) => ({
    dateRange: state.dateRange,
    comparisonDateRange: state.comparisonDateRange,
  })
);
