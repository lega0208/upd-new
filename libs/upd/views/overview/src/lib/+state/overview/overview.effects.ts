import { inject, Injectable } from '@angular/core';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, EMPTY, mergeMap, map, of } from 'rxjs';
import { selectDateRanges, selectDatePeriod } from '@dua-upd/upd/state';
import { ApiService } from '@dua-upd/upd/services';
import * as OverviewActions from './overview.actions';
import type { MostRelevantCommentsAndWords } from '@dua-upd/types-common';

@Injectable()
export class OverviewEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(ApiService);
  private readonly store = inject(Store);

  init$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(OverviewActions.init),
      concatLatestFrom(() => [this.store.select(selectDateRanges)]),
      mergeMap(([, apiParams]) =>
        this.api.getOverviewData(apiParams).pipe(
          map((data) => OverviewActions.loadOverviewSuccess({ data })),
          catchError(() => EMPTY),
        ),
      ),
    );
  });

  dateChange$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(selectDatePeriod),
      mergeMap(() => of(OverviewActions.init())),
    );
  });

  getMostRelevantFeedback$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(OverviewActions.getMostRelevantFeedback),
      concatLatestFrom(() => [this.store.select(selectDateRanges)]),
      mergeMap(([{ normalizationStrength }, { dateRange }]) =>
        this.api
          .get<
            MostRelevantCommentsAndWords,
            { dateRange: string; normalizationStrength: number }
          >('/api/feedback/most-relevant', { dateRange, normalizationStrength })
          .pipe(
            map((data) =>
              OverviewActions.getMostRelevantFeedbackSuccess({ data }),
            ),
            catchError(() => EMPTY),
          ),
      ),
    );
  });
}
