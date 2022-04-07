import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  PROJECTS_HOME_FEATURE_KEY,
  ProjectsHomeState,
} from './projects-home.reducer';

// Lookup the 'ProjectsHome' feature state managed by NgRx
export const getProjectsHomeState = createFeatureSelector<ProjectsHomeState>(
  PROJECTS_HOME_FEATURE_KEY
);

export const getProjectsHomeLoaded = createSelector(
  getProjectsHomeState,
  (state: ProjectsHomeState) => state.loaded
);

export const getProjectsHomeError = createSelector(
  getProjectsHomeState,
  (state: ProjectsHomeState) => state.error
);

export const getProjectsHomeData = createSelector(
  getProjectsHomeState,
  (state: ProjectsHomeState) => state.data
);
