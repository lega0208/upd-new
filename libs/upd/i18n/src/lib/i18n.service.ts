import { Injectable } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { LocaleId } from './types';
import { registerLocaleData } from '@angular/common';
import localeEnCa from '@angular/common/locales/en-CA';
import localeFrCa from '@angular/common/locales/fr-CA';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  constructor(private readonly translateService: TranslateService) { }

  get currentLang() {
    return this.translateService.currentLang;
  }

  setupI18n() {
    registerLocaleData(localeEnCa, 'en-CA');
    registerLocaleData(localeFrCa, 'fr-CA');
    this.translateService.setDefaultLang('en-CA');
  }

  observeKey(key: string): Observable<string> {
    return this.translateService.stream(key);
  }

  observeKeys(keys: string[]): Observable<Record<string, string>> {
    return this.translateService.stream(keys);
  }

  onLangChange(callback: (event: LangChangeEvent) => void) {
    this.translateService.onLangChange.subscribe(callback);
  }

  use(lang: LocaleId) {
    this.translateService.use(lang);
  }

  // to add translations at runtime if we need to
  addTranslations(lang: LocaleId, translations: Record<string, string>) {
    this.translateService.setTranslation(lang, translations, true);
  }
}
