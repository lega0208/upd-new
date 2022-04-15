import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map } from 'rxjs';

import { I18nService } from '@cra-arc/upd/i18n';
import * as I18nActions from './i18n.actions';
import { selectCurrentLang } from './i18n.selectors';
import { I18nState } from './i18n.reducer';

@Injectable()
export class I18nEffects {
  init$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(I18nActions.init),
        concatLatestFrom(() => this.store$.select(selectCurrentLang)),
        mergeMap(([, initialLang]) => this.i18n.use(initialLang))
      ),
    { dispatch: false }
  );

  setLang$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(I18nActions.setLang),
        mergeMap(({ lang }) => this.i18n.use(lang))
      ),
    { dispatch: false }
  );

  constructor(
    private readonly actions$: Actions,
    private store$: Store<I18nState>,
    private readonly i18n: I18nService
  ) {}
}
