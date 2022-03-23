import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { getSelectors, RouterReducerState } from '@ngrx/router-store';
import { catchError, EMPTY, mergeMap, map, pipe } from 'rxjs';

import * as PagesHomeActions from './pages-home.actions';
import { Store } from '@ngrx/store';
import { DateSelectionState, selectDateRanges } from '@cra-arc/upd/state';
import { PagesHomeData } from '@cra-arc/types-common';

@Injectable()
export class PagesHomeEffects {

  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesHomeActions.loadPagesHomeInit),
      concatLatestFrom(() => this.store.select(selectDateRanges)),
      mergeMap(([, dateRanges]) =>
        this.http
          .get<PagesHomeData[]>('/api/pages/home/getData', {
            responseType: 'json',
            observe: 'body',
            params: { dateRange: dateRanges.dateRange },
          })
          .pipe(
            map((data) => PagesHomeActions.loadPagesHomeSuccess({ data })),
            catchError(() => EMPTY)
          )
      )
    )
  );

  constructor(private readonly actions$: Actions, private store: Store<DateSelectionState>, private http: HttpClient) {}
}
