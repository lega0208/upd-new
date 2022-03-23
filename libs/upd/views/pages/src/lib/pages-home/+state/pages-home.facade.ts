import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';

import * as PagesHomeActions from './pages-home.actions';
import * as PagesHomeSelectors from './pages-home.selectors';

@Injectable()
export class PagesHomeFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(select(PagesHomeSelectors.getPagesHomeLoaded));
  pagesHomeData$ = this.store.pipe(select(PagesHomeSelectors.getPagesHomeData));
  error$ = this.store.pipe(select(PagesHomeSelectors.getPagesHomeError));

  constructor(private readonly store: Store) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  fetchData() {
    this.store.dispatch(PagesHomeActions.loadPagesHomeInit());
  }
}
