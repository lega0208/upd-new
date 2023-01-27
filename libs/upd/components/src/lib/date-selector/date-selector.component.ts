import { Component } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import {
  DateSelectionFacade,
  DateRangePeriod, selectPeriodSelectionLabel
} from '@dua-upd/upd/state';
import { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';

import { dateRangeConfigs, dayjs, DateRangeType } from '@dua-upd/utils-common';

@Component({
  selector: 'upd-date-selector',
  template: `
    <div class="row mb-4 mt-1 d-block">
      <upd-dropdown
        id="range-button"
        icon="calendar_today"
        [label]="periodSelectionLabel$ | async"
        [options]="selectionOptions"
        [onSelect]="selectPeriod.bind(this)"
      ></upd-dropdown>

      <span class="text-secondary ps-3 pe-2 text-nowrap dates-header-week">
        <strong>{{ displayFormatDateRange$ | async }}</strong>
      </span>
      <span
        class="text-secondary ps-0 pe-0 text-nowrap dates-header-week"
        data-i18n="compared_to"
        translate="compared_to"
      >
      </span>
      <span class="text-secondary ps-2 pe-0 text-nowrap dates-header-week">
        <strong>{{ displayFormatComparisonDateRange$ | async }}</strong>
      </span>
    </div>
  `,
  styleUrls: ['./date-selector.component.css'],
})
export class DateSelectorComponent {
  selectedPeriod$ = this.selectorService.dateSelectionPeriod$;

  periodSelectionLabel$ = this.selectorService.periodSelectionLabel$;

  displayFormatDateRanges$ = combineLatest([
    this.selectorService.dateRanges$,
    this.i18n.currentLang$,
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

  selectionOptions = dateRangeConfigs.map((config) => ({
    value: config.type,
    label: config.label,
  }));

  constructor(
    private i18n: I18nFacade,
    private selectorService: DateSelectionFacade
  ) {}

  selectPeriod(period: DateRangeType) {
    this.selectorService.selectDatePeriod(period);
  }
}

export const dateRangeToDisplayFormat = (date: string, lang: LocaleId) =>
  date
    .split('/')
    .map(
      (d) =>
        dayjs(d)
          .locale(lang)
          .format(lang === 'en-CA' ? 'MMM DD YYYY' : 'DD MMM YYYY') // only add year to end date
    )
    .join(' - ');
