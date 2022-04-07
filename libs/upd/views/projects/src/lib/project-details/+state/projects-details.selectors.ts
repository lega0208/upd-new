import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  PROJECTS_DETAILS_FEATURE_KEY,
  ProjectsDetailsState,
} from './projects-details.reducer';

// Lookup the 'ProjectsDetails' feature state managed by NgRx
export const getProjectsDetailsState =
  createFeatureSelector<ProjectsDetailsState>(PROJECTS_DETAILS_FEATURE_KEY);

export const getProjectsDetailsLoaded = createSelector(
  getProjectsDetailsState,
  (state: ProjectsDetailsState) => state.loaded
);

export const getProjectsDetailsError = createSelector(
  getProjectsDetailsState,
  (state: ProjectsDetailsState) => state.error
);

export const getProjectsDetailsData = createSelector(
  getProjectsDetailsState,
  (state: ProjectsDetailsState) => state.data
);
