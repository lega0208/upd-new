import { createAction, props } from '@ngrx/store';
import { ProjectsHomeData } from '@cra-arc/types-common';

export const loadProjectsHomeInit = createAction('[ProjectsHome] Init');

export const loadProjectsHomeSuccess = createAction(
  '[ProjectsHome/API] Load ProjectsHome Success',
  props<{ data: ProjectsHomeData }>()
);

export const loadProjectsHomeError = createAction(
  '[ProjectsHome/API] Load ProjectsHome Error',
  props<{ error: string }>()
);
