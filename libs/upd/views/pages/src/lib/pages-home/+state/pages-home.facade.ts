import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';

import * as PagesHomeActions from './pages-home.actions';
import * as PagesHomeSelectors from './pages-home.selectors';
import { debounceTime, map } from 'rxjs';

@Injectable()
export class PagesHomeFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loading$ = this.store.pipe(
    select(PagesHomeSelectors.getPagesHomeLoading),
    debounceTime(500),
  );
  loaded$ = this.store.pipe(select(PagesHomeSelectors.getPagesHomeLoaded));
  pagesHomeData$ = this.store.pipe(select(PagesHomeSelectors.getPagesHomeData));
  pagesHomeTableData$ = this.pagesHomeData$.pipe(
    map((pagesHomeData) => pagesHomeData?.dateRangeData || [])
  );
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
