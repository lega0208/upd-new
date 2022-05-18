import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map, of } from 'rxjs';

import * as TasksDetailsActions from './tasks-details.actions';
import {
  selectDatePeriod,
  selectDateRanges,
  selectRouteNestedParam,
} from '@dua-upd/upd/state';
import { Store } from '@ngrx/store';
import { ApiService } from '@dua-upd/upd/services';
import { selectTasksDetailsData } from './tasks-details.selectors';
import { loadTasksDetailsSuccess } from './tasks-details.actions';

@Injectable()
export class TasksDetailsEffects {
  init$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TasksDetailsActions.loadTasksDetailsInit),
      concatLatestFrom(() => [
        this.store.select(selectRouteNestedParam('id')),
        this.store.select(selectDateRanges),
        this.store.select(selectTasksDetailsData),
      ]),
      mergeMap(
        ([, taskId, { dateRange, comparisonDateRange }, taskDetailsData]) => {
          if (!taskId) {
            console.error('pageId not found when trying to load page details');
          }

          const taskIsLoaded = taskDetailsData._id === taskId; // page is already loaded (but not necessarily with the correct data)
          const dateRangeIsLoaded = taskDetailsData.dateRange === dateRange; // data for the dateRange is already loaded
          const comparisonDateRangeIsLoaded =
            taskDetailsData.comparisonDateRange === comparisonDateRange;

          if (
            taskIsLoaded &&
            dateRangeIsLoaded &&
            comparisonDateRangeIsLoaded
          ) {
            // if everything is already loaded in the state, don't update it
            return of(loadTasksDetailsSuccess({ data: null }));
          }

          return this.api
            .getTasksDetailsData({
              id: taskId,
              dateRange,
              ...{ comparisonDateRange },
            })
            .pipe(
              map((data) => loadTasksDetailsSuccess({ data })),
              catchError(() => EMPTY)
            );
        }
      )
    );
  });

  dateChange$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(selectDatePeriod),
      mergeMap(() => of(TasksDetailsActions.loadTasksDetailsInit()))
    );
  });

  constructor(
    private readonly actions$: Actions,
    private store: Store,
    private api: ApiService
  ) {}
}
