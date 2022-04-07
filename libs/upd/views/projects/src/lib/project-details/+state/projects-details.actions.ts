import { createAction, props } from '@ngrx/store';
import { ProjectsDetailsData } from './projects-details.models';

export const loadProjectsDetailsInit = createAction('[ProjectsDetails] Init');

export const loadProjectsDetailsSuccess = createAction(
  '[ProjectsDetails/API] Load ProjectsDetails Success',
  props<{ data: ProjectsDetailsData }>()
);

export const loadProjectsDetailsError = createAction(
  '[ProjectsDetails/API] Load ProjectsDetails Error',
  props<{ error: string }>()
);
