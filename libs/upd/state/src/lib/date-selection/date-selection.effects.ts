import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { map } from 'rxjs';

import * as DateSelectionActions from './date-selection.actions';
import * as DateSelectionSelectors from './date-selection.selectors';

@Injectable()
export class DateSelectionEffects {
  private readonly actions$ = inject(Actions);
  private store = inject(Store);
  private router = inject(Router);

  init$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(DateSelectionActions.selectDatePeriod),
        concatLatestFrom(() =>
          this.store.select(DateSelectionSelectors.selectDateRanges),
        ),
        map(([, { dateRange, comparisonDateRange }]) =>
          this.router.navigate([], {
            queryParams: {
              dateRange,
              comparisonDateRange,
            },
            queryParamsHandling: 'merge', // remove to replace all query params by provided
          }),
        ),
      );
    },
    { dispatch: false },
  );
}
