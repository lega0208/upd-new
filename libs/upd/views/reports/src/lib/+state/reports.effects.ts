import { inject, Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { catchError, mergeMap, map, of } from 'rxjs';
import { ApiService } from '@dua-upd/upd/services';
import * as ReportsActions from './reports.actions';

@Injectable()
export class ReportsEffects {
  private readonly actions$: Actions = inject(Actions);
  private api = inject(ApiService);

  init$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ReportsActions.loadReportsInit),
      mergeMap(() =>
        this.api.getReportsData().pipe(
          map((data) => ReportsActions.loadReportsSuccess({ data })),
          catchError((error) =>
            of(ReportsActions.loadReportsFailure({ error })),
          ),
        ),
      ),
    );
  });
}
