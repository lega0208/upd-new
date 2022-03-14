import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OVERVIEW_FEATURE_KEY, OverviewState } from './overview.reducer';

// Select full overview state
export const getOverviewState =
  createFeatureSelector<OverviewState>(OVERVIEW_FEATURE_KEY);

// select specific state properties
export const getOverviewLoaded = createSelector(
  getOverviewState,
  (state: OverviewState) => state.loaded
);

export const getOverviewLoading = createSelector(
  getOverviewState,
  (state: OverviewState) => state.loading
);

export const getOverviewError = createSelector(
  getOverviewState,
  (state: OverviewState) => state.error
);

export const getOverviewData = createSelector(
  getOverviewState,
  (state: OverviewState) => state.data
);
