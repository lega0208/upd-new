import { createFeatureSelector, createSelector } from '@ngrx/store';
import { REPORTS_FEATURE_KEY, ReportsState } from './reports.reducer';

// Lookup the 'Reports' feature state managed by NgRx
export const selectReportsState =
  createFeatureSelector<ReportsState>(REPORTS_FEATURE_KEY);

export const selectReportsLoaded = createSelector(
  selectReportsState,
  (state: ReportsState) => state.loaded
);

export const selectReportsError = createSelector(
  selectReportsState,
  (state: ReportsState) => state.error
);

export const selectReportsData = createSelector(
  selectReportsState,
  (state: ReportsState) => state.data
);
