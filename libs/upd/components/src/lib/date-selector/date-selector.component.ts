import { Component } from '@angular/core';
import { map } from 'rxjs';
import { DateSelectionFacade, DateRangePeriod } from '@cra-arc/upd/state';
import dayjs from 'dayjs';
//import 'dayjs/locale/en-CA';
//import 'dayjs/locale/fr-CA';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-date-selector',
  templateUrl: './date-selector.component.html',
  styleUrls: ['./date-selector.component.css'],
})
export class DateSelectorComponent {
  selectedPeriod$ = this.selectorService.dateSelectionPeriod$;

  displayFormatSelectedPeriod$ = this.selectedPeriod$.pipe(
    map((period) => periodToDisplayFormat(period))
  )

  displayFormatDateRanges$ = this.selectorService.dateRanges$.pipe(
    map(({ dateRange, comparisonDateRange }) => ({
      dateRange: dateRangeToDisplayFormat(dateRange),
      comparisonDateRange: dateRangeToDisplayFormat(comparisonDateRange),
    }))
  );

  displayFormatDateRange$ = this.displayFormatDateRanges$.pipe(
    map(({ dateRange }) => dateRange)
  );

  displayFormatComparisonDateRange$ = this.displayFormatDateRanges$.pipe(
    map(({ comparisonDateRange }) => comparisonDateRange)
  );

  selectionOptions = [
    'weekly',
    'monthly',
    'quarterly',
  ].map((period) => ({
    value: period as DateRangePeriod,
    label: periodToDisplayFormat(period as DateRangePeriod),
  }));

  constructor(public translateService: TranslateService, private selectorService: DateSelectionFacade) {}

  selectPeriod(period: DateRangePeriod) {
    this.selectorService.selectDatePeriod(period);
  }
}

export const dateRangeToDisplayFormat = (date: string) =>
  date
    .split('/')
    .map((d) => dayjs(d).format('MMM DD'))
    .join(' - ');

export const periodToDisplayFormat = (period: DateRangePeriod) => period.replace(/^(.+)ly$/, 'Last $1')
