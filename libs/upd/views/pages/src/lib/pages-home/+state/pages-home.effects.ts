import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map, pipe, of } from 'rxjs';

import * as PagesHomeActions from './pages-home.actions';
import { Store } from '@ngrx/store';
import {
  DateSelectionState,
  selectDatePeriod,
  selectDateRanges,
} from '@cra-arc/upd/state';
import { PagesHomeData } from '@cra-arc/types-common';
import { ApiService } from '@cra-arc/upd/services';

@Injectable()
export class PagesHomeEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesHomeActions.loadPagesHomeInit),
      concatLatestFrom(() => this.store.select(selectDateRanges)),
      mergeMap(([, { dateRange }]) =>
        this.api.getPagesHomeData({ dateRange }).pipe(
          map((data: PagesHomeData) =>
            PagesHomeActions.loadPagesHomeSuccess({ data })
          ),
          catchError(() => EMPTY)
        )
      )
    )
  );

  dateChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(selectDatePeriod),
      mergeMap(() => of(PagesHomeActions.loadPagesHomeInit()))
    )
  );

  constructor(
    private readonly actions$: Actions,
    private store: Store<DateSelectionState>,
    private api: ApiService
  ) {}
}
