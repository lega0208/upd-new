import { createAction, props } from '@ngrx/store';
import { TaskDetailsData } from '@dua-upd/types-common';

export const loadTasksDetailsInit = createAction('[TasksDetails] Init');

export const loadTasksDetailsSuccess = createAction(
  '[TasksDetails/API] Load TasksDetails Success',
  props<{ data: TaskDetailsData | null }>()
);

export const loadTasksDetailsError = createAction(
  '[TasksDetails/API] Load TasksDetails Error',
  props<{ error: string }>()
);

export const getMostRelevantFeedback = createAction(
  '[TasksDetails/API] Get Most Relevant Feedback',
  props<{ normalizationStrength: number }>(),
);

export const getMostRelevantFeedbackSuccess = createAction(
  '[TasksDetails/API] Get Most Relevant Feedback Success',
  props<{ data: TaskDetailsData['mostRelevantCommentsAndWords'] }>(),
);

export const getMostRelevantFeedbackError = createAction(
  '[TasksDetails/API] Get Most Relevant Feedback Error',
  props<{ error: string }>(),
);