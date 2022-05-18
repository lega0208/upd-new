import { createAction, props } from '@ngrx/store';
import { ProjectsDetailsData } from '@dua-upd/types-common';

export const loadProjectsDetailsInit = createAction('[ProjectsDetails] Init');

export const loadProjectsDetailsSuccess = createAction(
  '[ProjectsDetails/API] Load ProjectsDetails Success',
  props<{ data: ProjectsDetailsData | null }>()
);

export const loadProjectsDetailsError = createAction(
  '[ProjectsDetails/API] Load ProjectsDetails Error',
  props<{ error: string }>()
);
