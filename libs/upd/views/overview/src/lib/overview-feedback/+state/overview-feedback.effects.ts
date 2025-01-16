import { inject, Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import {
  catchError,
  EMPTY,
  mergeMap,
  map,
  concat,
  reduce,
} from 'rxjs';
import { selectDateRanges } from '@dua-upd/upd/state';
import { ApiService } from '@dua-upd/upd/services';
import { OverviewFeedbackActions } from './overview-feedback.actions';
import * as OverviewActions from '../../+state/overview/overview.actions';
import { MostRelevantCommentsAndWordsByLang } from '@dua-upd/types-common';

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
            // initial response gives us the number of parts left to fetch for the most relevant comments and words
            // with that, we create a nested observable to fetch all parts
            mergeMap((data) => {
              console.log('data');
              const parts = Array.from(
                { length: data.mostRelevantCommentsAndWords.parts },
                (_, i) => i,
              );

              const returnData = {
                ...data,
                mostRelevantCommentsAndWords: {
                  en: {
                    comments: [],
                    words: [],
                  },
                  fr: {
                    comments: [],
                    words: [],
                  },
                } as MostRelevantCommentsAndWordsByLang,
              };

              const requests$ = concat(
                ...parts.map((part) =>
                  this.api.getOverviewMostRelevant({
                    ...apiParams,
                    ipd,
                    part,
                  }),
                ),
              );

              const combinedData$ = requests$.pipe(
                reduce((acc, mostRelevant) => {
                  acc.mostRelevantCommentsAndWords.en.comments =
                    acc.mostRelevantCommentsAndWords.en.comments.concat(
                      mostRelevant.enComments,
                    );

                  acc.mostRelevantCommentsAndWords.en.words =
                    acc.mostRelevantCommentsAndWords.en.words.concat(
                      mostRelevant.enWords,
                    );

                  acc.mostRelevantCommentsAndWords.fr.comments =
                    acc.mostRelevantCommentsAndWords.fr.comments.concat(
                      mostRelevant.frComments,
                    );

                  acc.mostRelevantCommentsAndWords.fr.words =
                    acc.mostRelevantCommentsAndWords.fr.words.concat(
                      mostRelevant.frWords,
                    );

                  return acc;
                }, returnData),
              );

              return combinedData$;
            }),
            map((data) =>
              OverviewFeedbackActions.loadFeedbackSuccess({ data }),
            ),
            catchError(() => EMPTY),
          );
      }),
    );
  });
}
