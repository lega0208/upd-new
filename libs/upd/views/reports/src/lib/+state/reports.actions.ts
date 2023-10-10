import { createAction, props } from '@ngrx/store';
import { ReportsData } from '@dua-upd/types-common';

export const loadReportsInit = createAction('[Reports Page] Init');

export const loadReportsSuccess = createAction(
  '[Reports/API] Load Reports Success',
  props<{ data: ReportsData }>()
);

export const loadReportsFailure = createAction(
  '[Reports/API] Load Reports Failure',
  props<{ error: string }>()
);
