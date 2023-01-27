import { createAction, props } from '@ngrx/store';
import { DateRangeType } from '@dua-upd/utils-common';

export const selectDatePeriod = createAction(
  '[DateSelection] Select Date Period',
  props<{ selection: DateRangeType }>(),
)
