import { Injectable } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { LocaleId } from './i18n.types';
import { registerLocaleData } from '@angular/common';
import localeEnCa from '@angular/common/locales/en-CA';
import localeFrCa from '@angular/common/locales/fr-CA';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  constructor(private readonly translateService: TranslateService) {}

  get currentLang() {
    return this.translateService.currentLang as LocaleId;
  }

  async get(key: string | string[], interpolateParams?: object) {
    return firstValueFrom<string | Record<string, string>>(
      this.translateService.get(key, interpolateParams)
    );
  }

  setupI18n() {
    registerLocaleData(localeEnCa, 'en-CA');
    registerLocaleData(localeFrCa, 'fr-CA');
    this.translateService.setDefaultLang('en-CA');
  }

  observeKey(key: string): Observable<string | Record<string, unknown>> {
    return this.translateService.stream(key);
  }

  observeKeys(keys: string[]): Observable<Record<string, string>> {
    return this.translateService.stream(keys);
  }

  onLangChange(callback: (event: LangChangeEvent) => void) {
    this.translateService.onLangChange.subscribe(callback);
  }

  use(lang: LocaleId) {
    console.log('Setting lang to: ', lang);
    return this.translateService.use(lang);
  }

  translate(key: string, lang: LocaleId, interpolateParams?: object): string {
    this.translateService.use(lang);
    return this.translateService.instant(key, interpolateParams);
  }

  instant(key: string, interpolateParams?: object) {
    return this.translateService.instant(key, interpolateParams);
  }

  // to add translations at runtime if we need to
  addTranslations(lang: LocaleId, translations: Record<string, string>) {
    this.translateService.setTranslation(lang, translations, true);
  }
}
