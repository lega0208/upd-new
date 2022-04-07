import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  TASKS_DETAILS_FEATURE_KEY,
  TasksDetailsState,
} from './tasks-details.reducer';

// Lookup the 'TasksDetails' feature state managed by NgRx
export const selectTasksDetailsState = createFeatureSelector<TasksDetailsState>(
  TASKS_DETAILS_FEATURE_KEY
);

export const selectTasksDetailsLoaded = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.loaded
);

export const selectTasksDetailsError = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.error
);

export const selectTasksDetailsData = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.data
);
