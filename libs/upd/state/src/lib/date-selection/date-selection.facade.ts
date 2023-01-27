import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import * as DateSelectionActions from './date-selection.actions';
import * as DateSelectionSelectors from './date-selection.selectors';
import { DateRangeType } from '@dua-upd/utils-common';
import { selectPeriodSelectionLabel } from './date-selection.selectors';

@Injectable()
export class DateSelectionFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  dateRanges$ = this.store.select(DateSelectionSelectors.selectDateRanges);
  dateSelectionPeriod$ = this.store.select(
    DateSelectionSelectors.selectDatePeriodSelection
  );

  periodSelectionLabel$ = this.store.select(selectPeriodSelectionLabel);

  constructor(private readonly store: Store) {}

  selectDatePeriod(selection: DateRangeType) {
    this.store.dispatch(DateSelectionActions.selectDatePeriod({ selection }));
  }
}
