import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  OVERVIEW_FEEDBACK_FEATURE_KEY,
  type OverviewFeedbackState,
} from './overview-feedback.reducer';

export const selectOverviewFeedbackState =
  createFeatureSelector<OverviewFeedbackState>(OVERVIEW_FEEDBACK_FEATURE_KEY);

export const selectOverviewFeedbackData = createSelector(
  selectOverviewFeedbackState,
  (state: OverviewFeedbackState) => state.data,
);

export const selectOverviewFeedbackLoading = createSelector(
  selectOverviewFeedbackState,
  (state: OverviewFeedbackState) => state.loading,
);

export const selectOverviewFeedbackError = createSelector(
  selectOverviewFeedbackState,
  (state: OverviewFeedbackState) => state.error,
);
