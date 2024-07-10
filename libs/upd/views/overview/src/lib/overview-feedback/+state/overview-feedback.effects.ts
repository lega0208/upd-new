import { inject, Injectable } from '@angular/core';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, EMPTY, mergeMap, map } from 'rxjs';
import { selectDateRanges } from '@dua-upd/upd/state';
import { ApiService } from '@dua-upd/upd/services';
import { OverviewFeedbackActions } from './overview-feedback.actions';
import * as OverviewActions from '../../+state/overview/overview.actions';

@Injectable()
export class OverviewFeedbackEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(ApiService);
  private readonly store = inject(Store);

  // if overview is set to loading, set feedback to loading state
  loading$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(OverviewActions.init),
      map(() => OverviewFeedbackActions.loadFeedback()),
    );
  });

  // after the rest of overview is done loading, fetch feedback from api
  load$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(OverviewActions.loadOverviewSuccess),
      concatLatestFrom(() => [this.store.select(selectDateRanges)]),
      mergeMap(([, apiParams]) => {
        const ipd = new URLSearchParams(location.search).get('ipd') === 'true';

        return this.api
          .getOverviewFeedback({
            ...apiParams,
            ipd,
          })
          .pipe(
            map((data) =>
              OverviewFeedbackActions.loadFeedbackSuccess({ data }),
            ),
            catchError(() => EMPTY),
          );
      }),
    );
  });
}
