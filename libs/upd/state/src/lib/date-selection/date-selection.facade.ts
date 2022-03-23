import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';

import * as DateSelectionActions from './date-selection.actions';
import { DateSelectionState } from './date-selection.reducer';
import * as DateSelectionSelectors from './date-selection.selectors';
import { DateRangePeriod } from './date-selection.models';

@Injectable()
export class DateSelectionFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  dateRanges$ = this.store.pipe(
    select(DateSelectionSelectors.selectDateRanges)
  );
  dateSelectionPeriod$ = this.store.pipe(
    select(DateSelectionSelectors.selectDatePeriodSelection)
  );

  constructor(private readonly store: Store<DateSelectionState>) {}

  selectDatePeriod(selection: DateRangePeriod) {
    this.store.dispatch(DateSelectionActions.selectDatePeriod({ selection }));
  }
}
