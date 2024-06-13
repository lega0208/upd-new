import { createAction, props } from '@ngrx/store';
import { OverviewData } from '@dua-upd/types-common';

export const init = createAction('[Overview Page] Init');

export const loadOverviewSuccess = createAction(
  '[Overview/API] Load Overview Success',
  props<{ data: OverviewData }>(),
);

export const loadOverviewError = createAction(
  '[Overview/API] Load Overview Error',
  props<{ error: string }>(),
);

export const getMostRelevantFeedback = createAction(
  '[Overview Page] Get Most Relevant Feedback',
);

export const getMostRelevantFeedbackSuccess = createAction(
  '[Overview/API] Get Most Relevant Feedback Success',
  props<{ data: OverviewData['mostRelevantCommentsAndWords'] }>(),
);

export const getMostRelevantFeedbackError = createAction(
  '[Overview/API] Get Most Relevant Feedback Error',
  props<{ error: string }>(),
);
