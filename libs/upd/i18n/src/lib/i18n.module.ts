import { inject, Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { I18nService } from './i18n.service';
import { JsonLoader } from './i18n.loader';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TranslateModule.forChild({
      defaultLanguage: 'en-CA',
      loader: {
        provide: TranslateLoader,
        useClass: JsonLoader,
      },
    }),
  ],
  providers: [I18nService],
  exports: [TranslateModule]
})
export class I18nModule {
  static injector: Injector;

  constructor() {
    I18nModule.injector = inject(Injector);
  }

  static forRoot() {
    return TranslateModule.forRoot({
      defaultLanguage: 'en-CA',
      loader: {
        provide: TranslateLoader,
        useClass: JsonLoader,
      }
    })
  }
}



