import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';

import { init, setLang } from './i18n.actions';
import { I18nState } from './i18n.reducer';
import { selectCurrentLang } from './i18n.selectors';
import { I18nService, LocaleId } from '@cra-arc/upd/i18n';

@Injectable()
export class I18nFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  currentLang$ = this.store.pipe(select(selectCurrentLang));

  constructor(
    private readonly store: Store<I18nState>,
    private i18nService: I18nService
  ) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(init());
  }

  setLang(lang: LocaleId) {
    this.store.dispatch(setLang({ lang }));
  }

  get service() {
    return this.i18nService;
  }
}
