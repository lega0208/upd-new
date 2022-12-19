import { Injectable } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Store } from '@ngrx/store';

import { init, setLang } from './i18n.actions';
import { selectCurrentLang } from './i18n.selectors';
import { I18nService, LocaleId } from '@dua-upd/upd/i18n';
@Injectable()
export class I18nFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  currentLang$ = this.store.select(selectCurrentLang);

  constructor(
    private readonly store: Store,
    private i18nService: I18nService
  ) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    registerLocaleData(localeFr);
    this.store.dispatch(init());
  }

  setLang(lang: LocaleId) {
    this.store.dispatch(setLang({ lang }));
  }

  get service() {
    return this.i18nService;
  }
}
