import { createAction, props } from '@ngrx/store';
import { TaskDetailsData } from '@cra-arc/types-common';

export const loadTasksDetailsInit = createAction('[TasksDetails] Init');

export const loadTasksDetailsSuccess = createAction(
  '[TasksDetails/API] Load TasksDetails Success',
  props<{ data: TaskDetailsData | null }>()
);

export const loadTasksDetailsError = createAction(
  '[TasksDetails/API] Load TasksDetails Error',
  props<{ error: string }>()
);
