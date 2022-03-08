import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';

import * as OverviewActions from './overview.actions';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, mergeMap, map } from 'rxjs';

@Injectable()
export class OverviewEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OverviewActions.init),
      mergeMap(() => this.http.get('/api/overall/getVisits', {
          responseType: 'json',
          observe: 'body',
        }).pipe(
          map((data) => OverviewActions.loadOverviewSuccess({ data })),
          catchError(() => EMPTY)
        )),
    )
  );

  constructor(private readonly actions$: Actions, private http: HttpClient) {}
}
