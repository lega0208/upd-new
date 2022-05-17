import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { EMPTY, mergeMap, of } from 'rxjs';

import { I18nService, LocaleId } from '@cra-arc/upd/i18n';
import * as I18nActions from './i18n.actions';
import { selectCurrentLang } from './i18n.selectors';
import { selectRouteNestedParam } from '../../router/router.selectors';
import { ActivatedRoute, Router } from '@angular/router';

export type RouteLang = 'en' | 'fr';
const langToLocaleId: Record<RouteLang, LocaleId> = {
  en: 'en-CA',
  fr: 'fr-CA',
};

const localeIdToLang: Record<LocaleId, RouteLang> = {
  'en-CA': 'en',
  'fr-CA': 'fr',
};

@Injectable()
export class I18nEffects {
  init$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(I18nActions.init),
      concatLatestFrom(() => [this.store.select(selectCurrentLang)]),
      mergeMap(([, initialLang]) => {
        return of(I18nActions.setLang({ lang: initialLang }));
      })
    );
  });

  setLang$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(I18nActions.setLang),
        concatLatestFrom(() => [
          this.store.select(selectCurrentLang),
          this.store.select(selectRouteNestedParam('lang')),
          this.route.queryParams,
        ]),

        mergeMap(([{ lang }, currentLang, routeLang, queryParams]) => {
          if (lang !== currentLang) {
            this.i18n.use(lang);
          }

          if (!routeLang || routeLang !== localeIdToLang[lang]) {
            if (!location.pathname || location.pathname === '/') {
              return of(
                this.router.navigate(
                  [`/${localeIdToLang[lang]}/`],
                  {
                    replaceUrl: true,
                    queryParamsHandling: 'merge',
                    queryParams,
                  }
                )
              );
            }

            return of(
              this.router.navigate(
                [
                  location.pathname.replace(
                    /\/(en|fr)\//i,
                    `/${localeIdToLang[lang]}/`
                  ),
                ],
                {
                  replaceUrl: true,
                  queryParamsHandling: 'merge',
                  queryParams,
                }
              )
            );
          }

          return of(EMPTY);
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private readonly actions$: Actions,
    private store: Store,
    private readonly i18n: I18nService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}
}
