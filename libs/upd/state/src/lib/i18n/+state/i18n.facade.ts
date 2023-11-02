import { inject, Injectable } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Store } from '@ngrx/store';
import { I18nService, type LocaleId } from '@dua-upd/upd/i18n';
import { init, setLang } from './i18n.actions';
import { selectCurrentLang } from './i18n.selectors';
@Injectable()
export class I18nFacade {
  private readonly store = inject(Store);
  private readonly i18nService = inject(I18nService);

  currentLang$ = this.store.select(selectCurrentLang);

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
