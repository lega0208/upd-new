import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  PROJECTS_HOME_FEATURE_KEY,
  ProjectsHomeState,
} from './projects-home.reducer';

// Lookup the 'ProjectsHome' feature state managed by NgRx
export const selectProjectsHomeState = createFeatureSelector<ProjectsHomeState>(
  PROJECTS_HOME_FEATURE_KEY
);

export const selectProjectsHomeLoaded = createSelector(
  selectProjectsHomeState,
  (state: ProjectsHomeState) => state.loaded
);

export const selectProjectsHomeError = createSelector(
  selectProjectsHomeState,
  (state: ProjectsHomeState) => state.error
);

export const selectProjectsHomeData = createSelector(
  selectProjectsHomeState,
  (state: ProjectsHomeState) => state.data
);
