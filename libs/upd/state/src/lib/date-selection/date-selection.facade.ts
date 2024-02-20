import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type { DateRangeType } from '@dua-upd/utils-common';
import { selectDatePeriod } from './date-selection.actions';
import {
  selectDateRanges,
  selectDatePeriodSelection,
  selectDatePeriodSelectionWithLabel,
  selectPeriodSelectionLabel,
} from './date-selection.selectors';

@Injectable()
export class DateSelectionFacade {
  private readonly store: Store = inject(Store);

  dateRanges$ = this.store.select(selectDateRanges);

  dateSelectionPeriod$ = this.store.select(selectDatePeriodSelection);

  dateSelection$ = this.store.select(selectDatePeriodSelectionWithLabel);

  periodSelectionLabel$ = this.store.select(selectPeriodSelectionLabel);

  selectDatePeriod(selection: DateRangeType) {
    this.store.dispatch(selectDatePeriod({ selection }));
  }
}
