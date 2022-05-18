import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OVERVIEW_FEATURE_KEY, OverviewState } from './overview.reducer';

// Select full overview state
export const selectOverviewState =
  createFeatureSelector<OverviewState>(OVERVIEW_FEATURE_KEY);

// select specific state properties
export const selectOverviewLoaded = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.loaded
);

export const selectOverviewLoading = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.loading
);

export const selectOverviewError = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.error
);

export const selectOverviewData = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.data
);
