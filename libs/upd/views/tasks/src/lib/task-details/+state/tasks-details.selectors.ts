import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  TASKS_DETAILS_FEATURE_KEY,
  TasksDetailsState,
} from './tasks-details.reducer';
import { selectCurrentLang } from '@dua-upd/upd/state';

// Lookup the 'TasksDetails' feature state managed by NgRx
export const selectTasksDetailsState = createFeatureSelector<TasksDetailsState>(
  TASKS_DETAILS_FEATURE_KEY
);

export const selectTasksDetailsLoaded = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.loaded
);

export const selectTasksDetailsLoading = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.loading
);

export const selectTasksDetailsError = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.error
);

export const selectTasksDetailsData = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.data
);

export const selectTasksDetailsDataWithI18n = createSelector(
  selectTasksDetailsData,
  selectCurrentLang,
  (data, lang) => [data, lang] as const
);
