import { Injectable } from '@angular/core';
import {  Store } from '@ngrx/store';

import * as PagesHomeActions from './pages-home.actions';
import * as PagesHomeSelectors from './pages-home.selectors';
import { map } from 'rxjs';

@Injectable()
export class PagesHomeFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loading$ = this.store.select(PagesHomeSelectors.selectPagesHomeLoading);
  loaded$ = this.store.select((PagesHomeSelectors.selectPagesHomeLoaded));
  pagesHomeData$ = this.store.select((PagesHomeSelectors.selectPagesHomeData));
  pagesHomeTableData$ = this.pagesHomeData$.pipe(
    map((pagesHomeData) => [...pagesHomeData?.dateRangeData || []])
  );
  error$ = this.store.select((PagesHomeSelectors.selectPagesHomeError));

  constructor(private readonly store: Store) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  fetchData() {
    this.store.dispatch(PagesHomeActions.loadPagesHomeInit());
  }
}
