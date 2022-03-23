import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  PAGES_DETAILS_FEATURE_KEY,
  PagesDetailsState,
} from './pages-details.reducer';

// Lookup the 'PagesDetails' feature state managed by NgRx
export const selectPagesDetailsState = createFeatureSelector<PagesDetailsState>(
  PAGES_DETAILS_FEATURE_KEY
);

export const selectPagesDetailsLoaded = createSelector(
  selectPagesDetailsState,
  (state: PagesDetailsState) => state.loaded
);

export const selectPagesDetailsError = createSelector(
  selectPagesDetailsState,
  (state: PagesDetailsState) => state.error
);

export const selectPagesDetailsData = createSelector(
  selectPagesDetailsState,
  (state: PagesDetailsState) => state.data
);
