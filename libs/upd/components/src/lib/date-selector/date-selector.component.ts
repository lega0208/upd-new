import { Component } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { DateSelectionFacade, DateRangePeriod } from '@dua-upd/upd/state';
import { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';

import dayjs from 'dayjs';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';

@Component({
  selector: 'upd-date-selector',
  templateUrl: './date-selector.component.html',
  styleUrls: ['./date-selector.component.css'],
})
export class DateSelectorComponent {
  selectedPeriod$ = this.selectorService.dateSelectionPeriod$;

  displayFormatSelectedPeriod$ = this.selectedPeriod$.pipe(
    map((period) => periodToDisplayFormat(period))
  );

  displayFormatDateRanges$ = combineLatest([
    this.selectorService.dateRanges$,
    this.i18n.currentLang$
  ]).pipe(
    map(([{ dateRange, comparisonDateRange }, lang]) => ({
      dateRange: dateRangeToDisplayFormat(dateRange, lang),
      comparisonDateRange: dateRangeToDisplayFormat(comparisonDateRange, lang),
    }))
  );

  displayFormatDateRange$ = this.displayFormatDateRanges$.pipe(
    map(({ dateRange }) => dateRange)
  );

  displayFormatComparisonDateRange$ = this.displayFormatDateRanges$.pipe(
    map(({ comparisonDateRange }) => comparisonDateRange)
  );

  selectionOptions = ['weekly', 'monthly', 'quarterly'].map((period) => ({
    value: period as DateRangePeriod,
    label: periodToDisplayFormat(period as DateRangePeriod),
  }));

  constructor(
    private i18n: I18nFacade,
    private selectorService: DateSelectionFacade
  ) {}

  selectPeriod(period: DateRangePeriod) {
    this.selectorService.selectDatePeriod(period);
  }
}

export const dateRangeToDisplayFormat = (date: string, lang: LocaleId) =>
  date
    .split('/')
    .map((d) => dayjs(d).locale(lang).format(lang === 'en-CA' ? 'MMM DD' : 'DD MMM'))
    .join(' - ');

export const periodToDisplayFormat = (period: DateRangePeriod) =>
  period.replace(/^(.+)ly$/, 'Last $1');
