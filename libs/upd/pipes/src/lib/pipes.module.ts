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

  transform(value?: Date | null, format = 'mediumDate', lang?: LocaleId) {
    return value instanceof Date
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

@NgModule({
  imports: [I18nModule],
  declarations: [LocaleNumberPipe, LocaleDatePipe, LocalePercentPipe],
  providers: [LocaleNumberPipe, LocaleDatePipe, LocalePercentPipe],
  exports: [LocaleNumberPipe, LocaleDatePipe, LocalePercentPipe],
})
export class PipesModule {}
