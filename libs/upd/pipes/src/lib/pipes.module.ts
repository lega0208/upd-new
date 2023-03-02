import { ChangeDetectorRef, NgModule, Pipe, PipeTransform } from '@angular/core';
import { formatNumber, formatDate, formatPercent } from '@angular/common';
import { I18nModule, I18nService, LocaleId } from '@dua-upd/upd/i18n';

@Pipe({ name: 'localeNumber', pure: false })
export class LocaleNumberPipe implements PipeTransform {
  constructor(private i18n: I18nService) {}

  transform(value?: number | null, digitsInfo?: string) {
    return typeof value === 'number'
      ? formatNumber(value, this.i18n.currentLang, digitsInfo)
      : value;
  }
}

@Pipe({ name: 'localeDate', pure: false })
export class LocaleDatePipe implements PipeTransform {
  constructor(private i18n: I18nService, private _ref: ChangeDetectorRef) {}

  transform(value?: string | Date | null, format = 'mediumDate', lang?: LocaleId) {
    return (value instanceof Date || typeof value === 'string')
      ? formatDate(value, format, lang ?? this.i18n.currentLang, 'UTC')
      : value;
  }
}

@Pipe({ name: 'localePercent', pure: false })
export class LocalePercentPipe implements PipeTransform {
  constructor(private i18n: I18nService) {}

  transform(value?: number | null, digitsInfo?: string) {
    return typeof value === 'number'
      ? formatPercent(value, this.i18n.currentLang, digitsInfo)
      : value;
  }
}

@Pipe({ name: 'translateArray', pure: true })
export class TranslateArrayPipe implements PipeTransform {
  constructor(private i18n: I18nService) {}

  transform(values: string[]): string[] {
    return values.map((value) => this.i18n.translate(value, this.i18n.currentLang));
  }
}

@Pipe({ name: 'arrayToText', pure: true })
export class ArrayToTextPipe implements PipeTransform {
  transform(values: string[]): string {
    return values.join(', ');
  }
}


@NgModule({
  imports: [I18nModule],
  declarations: [LocaleNumberPipe, LocaleDatePipe, LocalePercentPipe, TranslateArrayPipe, ArrayToTextPipe],
  providers: [LocaleNumberPipe, LocaleDatePipe, LocalePercentPipe, TranslateArrayPipe, ArrayToTextPipe],
  exports: [LocaleNumberPipe, LocaleDatePipe, LocalePercentPipe, TranslateArrayPipe, ArrayToTextPipe],
})
export class PipesModule {}
