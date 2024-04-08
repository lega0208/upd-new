import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import enCA from './translations/en-CA.json';
import frCA from './translations/fr-CA.json';
import calldriversEnCA from './translations/calldrivers_en-CA.json';
import calldriversfrCA from './translations/calldrivers_fr-CA.json';
import tasksEnCA from './translations/tasks_en-CA.json';
import tasksFrCA from './translations/tasks_fr-CA.json';
import type { LocaleId } from './i18n.types';

export type TranslationJson = Record<string, string | Record<string, unknown>>;

export class JsonLoader implements TranslateLoader {
  getTranslation(lang: LocaleId): Observable<TranslationJson> {
    switch (lang) {
      case 'en-CA':
        return of({ ...enCA, ...calldriversEnCA, ...tasksEnCA });
      case 'fr-CA':
        return of({ ...frCA, ...calldriversfrCA, ...tasksFrCA });
    }
  }
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
