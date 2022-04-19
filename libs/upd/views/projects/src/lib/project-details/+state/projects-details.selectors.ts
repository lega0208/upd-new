import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  PROJECTS_DETAILS_FEATURE_KEY,
  ProjectsDetailsState,
} from './projects-details.reducer';

// Lookup the 'ProjectsDetails' feature state managed by NgRx
export const selectProjectsDetailsState =
  createFeatureSelector<ProjectsDetailsState>(PROJECTS_DETAILS_FEATURE_KEY);

export const selectProjectsDetailsLoaded = createSelector(
  selectProjectsDetailsState,
  (state: ProjectsDetailsState) => state.loaded
);

export const selectProjectsDetailsError = createSelector(
  selectProjectsDetailsState,
  (state: ProjectsDetailsState) => state.error
);

export const selectProjectsDetailsData = createSelector(
  selectProjectsDetailsState,
  (state: ProjectsDetailsState) => state.data
);
