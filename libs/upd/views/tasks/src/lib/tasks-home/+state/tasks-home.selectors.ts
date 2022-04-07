import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TASKS_HOME_FEATURE_KEY, TasksHomeState } from './tasks-home.reducer';

// Lookup the 'TasksHome' feature state managed by NgRx
export const getTasksHomeState = createFeatureSelector<TasksHomeState>(
  TASKS_HOME_FEATURE_KEY
);

export const getTasksHomeLoaded = createSelector(
  getTasksHomeState,
  (state: TasksHomeState) => state.loaded
);

export const getTasksHomeError = createSelector(
  getTasksHomeState,
  (state: TasksHomeState) => state.error
);

export const getTasksHomeData = createSelector(
  getTasksHomeState,
  (state: TasksHomeState) => ({
    ...(state.data || {}),
    dateRangeData: [...state.data?.dateRangeData || []]
  })
);
