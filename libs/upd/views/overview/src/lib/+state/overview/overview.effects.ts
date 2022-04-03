import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map, of } from 'rxjs';

import { selectDateRanges, selectDatePeriod } from '@cra-arc/upd/state';
import { ApiService } from '@cra-arc/upd/services';
import { OverviewData } from '@cra-arc/types-common';
import * as OverviewActions from './overview.actions';
import { Store } from '@ngrx/store';

@Injectable()
export class OverviewEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OverviewActions.init),
      concatLatestFrom(() => [this.store$.select(selectDateRanges)]),
      mergeMap(([, apiParams]) =>
        this.api.getOverviewData(apiParams).pipe(
          map((data) => OverviewActions.loadOverviewSuccess({ data })),
          catchError(() => EMPTY)
        )
      )
    )
  );

  dateChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(selectDatePeriod),
      mergeMap(() => of(OverviewActions.init()))
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly api: ApiService,
    private readonly store$: Store,
  ) {}
}
