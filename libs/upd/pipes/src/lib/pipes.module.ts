import {
  ChangeDetectorRef,
  inject,
  NgModule,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { formatNumber, formatDate, formatPercent } from '@angular/common';
import { I18nModule, I18nService, type LocaleId } from '@dua-upd/upd/i18n';

@Pipe({ name: 'localeNumber', pure: false })
export class LocaleNumberPipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(value?: number | null, digitsInfo?: string) {
    return typeof value === 'number'
      ? formatNumber(value, this.i18n.currentLang, digitsInfo)
      : value;
  }
}

@Pipe({ name: 'localeDate', pure: false })
export class LocaleDatePipe implements PipeTransform {
  private i18n = inject(I18nService);
  private _ref = inject(ChangeDetectorRef, { host: true });

  transform(
    value?: string | Date | null,
    format = 'mediumDate',
    lang?: LocaleId,
  ) {
    return value instanceof Date || typeof value === 'string'
      ? formatDate(value, format, lang ?? this.i18n.currentLang, 'UTC')
      : value;
  }
}

@Pipe({ name: 'localePercent', pure: false })
export class LocalePercentPipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(value?: number | null, digitsInfo?: string) {
    return typeof value === 'number'
      ? formatPercent(value, this.i18n.currentLang, digitsInfo)
      : value;
  }
}

@Pipe({ name: 'localeTemplate', pure: false })
export class LocaleTemplatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(
    value?: number | number[] | null,
    template = '{{}}',
    digitsInfo?: string,
  ) {
    if (!value) return value;

    if (Array.isArray(value)) {
      let output = `${template}`;

      for (const val of value) {
        const formattedValue = formatNumber(
          val,
          this.i18n.currentLang,
          digitsInfo,
        );

        output = output.replace('{{}}', formattedValue);
      }

      return output;
    }

    const formattedValue = formatNumber(
      value,
      this.i18n.currentLang,
      digitsInfo,
    );

    return template.replace('{{}}', formattedValue);
  }
}

@Pipe({ name: 'translateArray', pure: true })
export class TranslateArrayPipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(values: string[]): string[] {
    return values.map((value) =>
      this.i18n.translate(value, this.i18n.currentLang),
    );
  }
}

@Pipe({ name: 'arrayToText', pure: true })
export class ArrayToTextPipe implements PipeTransform {
  transform(values: string[]): string {
    return values.join(', ');
  }
}

@Pipe({ name: 'truncate', pure: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 160): string {
    if (value.length > limit) {
      return value.substring(0, limit) + '...';
    }
    return value;
  }
}

@NgModule({
  imports: [I18nModule],
  declarations: [
    LocaleNumberPipe,
    LocaleDatePipe,
    LocalePercentPipe,
    LocaleTemplatePipe,
    TranslateArrayPipe,
    ArrayToTextPipe,
    TruncatePipe,
  ],
  providers: [
    LocaleNumberPipe,
    LocaleDatePipe,
    LocalePercentPipe,
    LocaleTemplatePipe,
    TranslateArrayPipe,
    ArrayToTextPipe,
    TruncatePipe,
  ],
  exports: [
    LocaleNumberPipe,
    LocaleDatePipe,
    LocalePercentPipe,
    LocaleTemplatePipe,
    TranslateArrayPipe,
    ArrayToTextPipe,
    TruncatePipe,
  ],
})
export class PipesModule {}
