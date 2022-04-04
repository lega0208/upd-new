import { createAction, props } from '@ngrx/store';
import { OverviewData } from '@cra-arc/types-common';

export const init = createAction('[Overview Page] Init');

export const loadOverviewSuccess = createAction(
  '[Overview/API] Load Overview Success',
  props<{ data: OverviewData }>()
);

export const loadOverviewError = createAction(
  '[Overview/API] Load Overview Error',
  props<{ error: string }>()
);
