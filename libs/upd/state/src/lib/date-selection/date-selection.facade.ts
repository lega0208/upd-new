import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type { DateRangeType } from '@dua-upd/utils-common';
import * as DateSelectionActions from './date-selection.actions';
import * as DateSelectionSelectors from './date-selection.selectors';
import { selectPeriodSelectionLabel } from './date-selection.selectors';

@Injectable()
export class DateSelectionFacade {
  private readonly store: Store = inject(Store);

  dateRanges$ = this.store.select(DateSelectionSelectors.selectDateRanges);
  dateSelectionPeriod$ = this.store.select(
    DateSelectionSelectors.selectDatePeriodSelection,
  );

  periodSelectionLabel$ = this.store.select(selectPeriodSelectionLabel);

  selectDatePeriod(selection: DateRangeType) {
    this.store.dispatch(DateSelectionActions.selectDatePeriod({ selection }));
  }
}
