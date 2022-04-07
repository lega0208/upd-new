import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map } from 'rxjs';

import * as TasksHomeActions from './tasks-home.actions';
import { Store } from '@ngrx/store';
import { DateSelectionState, selectDateRanges } from '@cra-arc/upd/state';
import { ApiService } from '@cra-arc/upd/services';

@Injectable()
export class TasksHomeEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksHomeActions.loadTasksHomeInit),
      concatLatestFrom(() => this.store.select(selectDateRanges)),
      mergeMap(([, { dateRange }]) =>
        this.api.getTasksHomeData({ dateRange }).pipe(
          map((data) => TasksHomeActions.loadTasksHomeSuccess({ data })),
          catchError(() => EMPTY)
        )
      )
    )
  );

  constructor(
    private readonly actions$: Actions,
    private store: Store<DateSelectionState>,
    private api: ApiService
  ) {}
}
