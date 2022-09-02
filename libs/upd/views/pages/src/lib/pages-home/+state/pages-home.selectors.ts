import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PAGES_HOME_FEATURE_KEY, PagesHomeState } from './pages-home.reducer';

// Lookup the 'PagesHome' feature state managed by NgRx
export const selectPagesHomeState = createFeatureSelector<PagesHomeState>(
  PAGES_HOME_FEATURE_KEY
);

export const selectPagesHomeLoaded = createSelector(
  selectPagesHomeState,
  (state: PagesHomeState) => state.loaded
);

export const selectPagesHomeLoading = createSelector(
  selectPagesHomeState,
  (state: PagesHomeState) => state.loading
);

export const selectPagesHomeError = createSelector(
  selectPagesHomeState,
  (state: PagesHomeState) => state.error
);

export const selectPagesHomeData = createSelector(
  selectPagesHomeState,
  (state: PagesHomeState) => ({
    ...(state.data || {}),
  })
);
