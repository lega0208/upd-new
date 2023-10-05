import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map } from 'rxjs';
import { ApiService } from '@dua-upd/upd/services';
import * as ReportsActions from './reports.actions';

@Injectable()
export class ReportsEffects {
  init$ = createEffect(() =>
    { return this.actions$.pipe(
      ofType(ReportsActions.loadReportsInit),
      mergeMap(() =>
        this.api.getReportsData().pipe(
          map((data) => ReportsActions.loadReportsSuccess({ data })),
          catchError(() => EMPTY)
        )
      )
    ) }
  );

  constructor(private readonly actions$: Actions, private api: ApiService) {}
}
