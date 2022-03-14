import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';

import * as OverviewActions from './overview.actions';
import { OverviewState } from './overview.reducer';
import * as OverviewSelectors from './overview.selectors';

@Injectable()
export class OverviewFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(select(OverviewSelectors.getOverviewLoaded));
  loading$ = this.store.pipe(select(OverviewSelectors.getOverviewLoading));
  overviewData$ = this.store.pipe(select(OverviewSelectors.getOverviewData));
  error$ = this.store.pipe(select(OverviewSelectors.getOverviewError));

  constructor(private readonly store: Store<OverviewState>) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(OverviewActions.init());
  }
}
