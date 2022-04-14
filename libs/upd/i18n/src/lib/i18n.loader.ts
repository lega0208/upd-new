import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import * as enCA from './translations/en-CA.json';
import * as frCA from './translations/fr-CA.json';
import { LocaleId } from './types';

export class JsonLoader implements TranslateLoader {
  getTranslation(lang: LocaleId): Observable<Record<string, string>> {
    switch (lang) {
      case 'en-CA':
        return of(enCA as Record<string, string>);
      case 'fr-CA':
        return of(frCA as Record<string, string>);
    }
  }
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
