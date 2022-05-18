import { createAction, props } from '@ngrx/store';
import { TasksHomeData } from '@dua-upd/types-common';

export const loadTasksHomeInit = createAction('[TasksHome] Init');

export const loadTasksHomeSuccess = createAction(
  '[TasksHome/API] Load TasksHome Success',
  props<{ data: TasksHomeData }>()
);

export const loadTasksHomeError = createAction(
  '[TasksHome/API] Load TasksHome Error',
  props<{ error: string }>()
);
