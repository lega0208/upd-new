import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map, of } from 'rxjs';

import * as TasksHomeActions from './tasks-home.actions';

import { Store } from '@ngrx/store';
import {
  DateSelectionState,
  selectDatePeriod,
  selectDateRanges,
} from '@dua-upd/upd/state';
import { ApiService } from '@dua-upd/upd/services';

@Injectable()
export class TasksHomeEffects {
  init$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TasksHomeActions.loadTasksHomeInit),
      concatLatestFrom(() => this.store.select(selectDateRanges)),
      mergeMap(([, { dateRange, comparisonDateRange }]) =>
        this.api.getTasksHomeData({ dateRange, comparisonDateRange }).pipe(
          map((data) => TasksHomeActions.loadTasksHomeSuccess({ data })),
          catchError(() => EMPTY)
        )
      )
    );
  });

  dateChange$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(selectDatePeriod),
      mergeMap(() => of(TasksHomeActions.loadTasksHomeInit()))
    );
  });

  constructor(
    private readonly actions$: Actions,
    private store: Store,
    private api: ApiService
  ) {}
}
