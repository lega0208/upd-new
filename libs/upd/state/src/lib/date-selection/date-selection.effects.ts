import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { map, withLatestFrom, } from 'rxjs';

import * as DateSelectionActions from './date-selection.actions';
import * as DateSelectionSelectors from './date-selection.selectors';

@Injectable()
export class DateSelectionEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DateSelectionActions.selectDatePeriod),
      withLatestFrom(this.store$.pipe(select(DateSelectionSelectors.getDateRanges))),
      map(([, { dateRange, comparisonDateRange } ]) => this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          dateRange,
          comparisonDateRange,
        },
        queryParamsHandling: 'merge', // remove to replace all query params by provided
      }))
    ),
    { dispatch: false }
  );

  constructor(
    private readonly actions$: Actions,
    private http: HttpClient,
    private store$: Store,
    private router: Router,
    private route: ActivatedRoute
  ) {}
}
