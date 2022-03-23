import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PAGES_HOME_FEATURE_KEY, PagesHomeState } from './pages-home.reducer';

// Lookup the 'PagesHome' feature state managed by NgRx
export const getPagesHomeState = createFeatureSelector<PagesHomeState>(
  PAGES_HOME_FEATURE_KEY
);

export const getPagesHomeLoaded = createSelector(
  getPagesHomeState,
  (state: PagesHomeState) => state.loaded
);

export const getPagesHomeError = createSelector(
  getPagesHomeState,
  (state: PagesHomeState) => state.error
);

export const getPagesHomeData = createSelector(
  getPagesHomeState,
  (state: PagesHomeState) => state.data
);
