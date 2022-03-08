import { createAction, props } from '@ngrx/store';
import { OverviewData } from './overview.models';

export const init = createAction('[Overview Page] Init');

export const loadOverviewSuccess = createAction(
  '[Overview/API] Load Overview Success',
  props<{ data: unknown }>()
);

export const loadOverviewError = createAction(
  '[Overview/API] Load Overview Error',
  props<{ error: string }>()
);
