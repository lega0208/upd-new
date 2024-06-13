import { createAction, props } from '@ngrx/store';
import type { DateRangeType } from '@dua-upd/utils-common';

export const selectDatePeriod = createAction(
  '[DateSelection] Select Date Period',
  props<{
    selection: DateRangeType;
    customDateRange?: string; // YYYY-MM-DD format
    customComparisonDateRange?: string; // YYYY-MM-DD format
  }>(),
);
