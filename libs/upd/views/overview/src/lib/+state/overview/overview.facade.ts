import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { map } from 'rxjs';

import * as OverviewActions from './overview.actions';
import { OverviewState } from './overview.reducer';
import * as OverviewSelectors from './overview.selectors';
import { MultiSeries } from '@amonsour/ngx-charts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

@Injectable()
export class OverviewFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(select(OverviewSelectors.getOverviewLoaded));
  loading$ = this.store.pipe(select(OverviewSelectors.getOverviewLoading));
  overviewData$ = this.store.pipe(select(OverviewSelectors.getOverviewData));

  visitors$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.visitors)
  );
  prevVisitors$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.comparisonDateRangeData?.visitors)
  );

  visits$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.visits)
  );
  prevVisits$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.comparisonDateRangeData?.visits)
  );

  views$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.pageViews)
  );
  prevViews$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.comparisonDateRangeData?.pageViews)
  );

  impressions$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.impressions)
  );
  prevImpressions$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.comparisonDateRangeData?.impressions)
  );

  ctr$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.ctr)
  );
  prevCtr$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.comparisonDateRangeData?.ctr)
  );

  avgRank$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.avgRank)
  );
  prevAvgRank$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.comparisonDateRangeData?.avgRank)
  );

  // todo: reorder bars? (grey then blue instead of blue then grey?)
  //  also clean this up a bit, simplify logic instead of doing everything twice
  visitsByDay$ = this.overviewData$.pipe(
    map((data) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const comparisonVisitsByDay =
        data?.comparisonDateRangeData?.visitsByDay || [];

      if (!visitsByDay) {
        return [] as MultiSeries;
      }

      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange);
      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange
      );

      const dateRangeDates = visitsByDay.map(({ date }) => date);

      const dateRangeSeries = visitsByDay.map(({ visits }) => ({
        name: dateRangeLabel, // todo: date label (x-axis) formatting based on date range length
        value: visits,
      }));

      const comparisonDateRangeSeries = comparisonVisitsByDay.map(
        ({ visits }) => ({
          name: comparisonDateRangeLabel,
          value: visits,
        })
      );

      const visitsByDayData: MultiSeries = dateRangeDates.map((date, i) => ({
        name: dayjs(date).utc(false).format('dddd'),
        series: [dateRangeSeries[i], comparisonDateRangeSeries[i]],
      }));

      return visitsByDayData;
    })
  );

  error$ = this.store.pipe(select(OverviewSelectors.getOverviewError));

  constructor(private readonly store: Store<OverviewState>) {}

  init() {
    this.store.dispatch(OverviewActions.init());
  }
}

const getWeeklyDatesLabel = (dateRange: string) => {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const formattedStartDate = dayjs(startDate).utc(false).format('MMM D');
  const formattedEndDate = dayjs(endDate).utc(false).format('MMM D');

  return `${formattedStartDate}-${formattedEndDate}`;
};
