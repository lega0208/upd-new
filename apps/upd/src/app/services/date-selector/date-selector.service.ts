import { Injectable } from '@angular/core';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';
import dayjs from 'dayjs';
import { ActivatedRoute, Params, Router } from '@angular/router';

// need to rewrite this whole service

export interface DateRange {
  startDate: Date | string;
  endDate: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class DateSelectorService {
  private periodSelection: 'week' | 'month' = 'month';
  private comparisonSelection = false; // for later, we can implement optional comparison
  private dateRange: DateRange;
  private dateParams?: DateRange;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.dateRange = this.getDefaultDateRange();

    this.initDates();
  }

  public getDefaultDateRange() {
    let endDate = dayjs().startOf(this.periodSelection);

    if (this.periodSelection === 'month') {
      endDate = endDate.subtract(1, 'day');
    }

    let startDate = endDate.subtract(1, 'day').startOf(this.periodSelection);

    if (this.periodSelection === 'week') {
      startDate = startDate.add(1, 'day');
    }

    return {
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
    };
  }

  public getPeriodSelection() {
    return this.periodSelection;
  }
  public setPeriodSelection(period: 'week' | 'month') {
    this.periodSelection = period;
  }

  public getComparisonSelection() {
    return this.comparisonSelection;
  }
  public setComparison(comparisonSelection: boolean) {
    this.comparisonSelection = comparisonSelection;
  }

  public getPeriod(periodType: 'current' | 'prior' | 'full' = 'current'): DateRange {
    // let periodEnd = dayjs().startOf(this.periodSelection).subtract(1, 'day');
    // let periodStart = periodEnd.startOf(this.periodSelection);
    //
    // if (periodType === 'prior') {
    //   periodEnd = periodEnd.subtract(1, this.periodSelection);
    //   periodStart = periodStart.subtract(1, this.periodSelection);
    // } else if (periodType === 'full') {
    //   periodStart = periodStart.subtract(1, this.periodSelection);
    // }

    const periodStart = dayjs(this.dateRange.startDate);
    const periodEnd = dayjs(this.dateRange.endDate);

    return {
      startDate: periodStart.format('MMM DD'),
      endDate: periodEnd.format('MMM DD'),
    };
  }

  public getFormattedDateRange() {
    const dateRange = this.getPeriod('full');

    return `${dateRange.startDate}/${dateRange.endDate}`;
  }

  public toFormat(date: Date, format: string): string {
    return dayjs(date).format(format);
  }

  public getDateUtils() {
    return dayjs;
  }

  public getDateParams(): DateRange {
    return <DateRange>this.dateParams;
  }

  public async setDateParams(queryParams: Params) {
    this.dateParams = {
      startDate: queryParams['startDate'] || this.dateParams?.startDate,
      endDate:  queryParams['endDate'] || this.dateParams?.endDate,
    }

    return this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge', // remove to replace all query params by provided
      })
  }

  initDates() {
    const currentParams = this.route.snapshot.queryParamMap;
    this.dateParams = {
      startDate:
        currentParams.get('startDate') || this.toFormat(this.dateRange.startDate as Date, 'YYYY-MM-D'),
      endDate:
        currentParams.get('endDate') || this.toFormat(this.dateRange.endDate as Date, 'YYYY-MM-D'),
    }

    this.setDateParams(this.dateParams).then(() => {
        this.route.queryParams.subscribe(params => {
          if (!!params['startDate'] && !!params['endDate'])
            return;

          const newParams: Params = {};

          if (!params['startDate']) {
            newParams['startDate'] = this.dateParams?.startDate;
          }

          if (!params['endDate']) {
            newParams['endDate'] = this.dateParams?.endDate;
          }

          return this.setDateParams(newParams);
        });
      });
  }
}
