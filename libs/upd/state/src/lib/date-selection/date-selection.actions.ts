import { createAction, props } from '@ngrx/store';
import { DateRangePeriod } from './date-selection.models';

export const selectDatePeriod = createAction(
  '[DateSelection] Select Date Period',
  props<{ selection: DateRangePeriod }>(),
)
