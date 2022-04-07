import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { map } from 'rxjs';

import * as OverviewActions from './overview.actions';
import { OverviewState } from './overview.reducer';
import * as OverviewSelectors from './overview.selectors';
import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { OverviewAggregatedData, OverviewData } from '@cra-arc/types-common';
import { percentChange, PickByType } from '@cra-arc/utils-common';

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
  visitorsPercentChange$ = this.overviewData$.pipe(
    mapToPercentChange('visitors')
  );

  visits$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.visits)
  );
  visitsPercentChange$ = this.overviewData$.pipe(mapToPercentChange('visits'));

  views$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.pageViews)
  );
  viewsPercentChange$ = this.overviewData$.pipe(
    mapToPercentChange('pageViews')
  );

  impressions$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.impressions)
  );
  impressionsPercentChange$ = this.overviewData$.pipe(
    mapToPercentChange('impressions')
  );

  ctr$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.ctr)
  );
  ctrPercentChange$ = this.overviewData$.pipe(mapToPercentChange('ctr'));

  avgRank$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.avgRank)
  );
  avgRankPercentChange$ = this.overviewData$.pipe(
    mapToPercentChange('avgRank')
  );

  topPagesVisited$ = this.overviewData$.pipe(
    map((data) => {
      const topPages = data?.dateRangeData?.topPagesVisited || [];

      return topPages;
    })
  );

  top10GSC$ = this.overviewData$.pipe(
    map((data) => data?.dateRangeData?.top10GSC)
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

      const dateRangeDates = visitsByDay.map(({ date }) => date);

      const dateRangeSeries = visitsByDay.map(({ visits }) => ({
        name: dateRangeLabel, // todo: date label (x-axis) formatting based on date range length
        value: visits,
      }));

      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange || ''
      );

      const comparisonDateRangeSeries = comparisonVisitsByDay.map(
        ({ visits }) => ({
          name: comparisonDateRangeLabel,
          value: visits,
        })
      );

      const visitsByDayData: MultiSeries = dateRangeDates.map((date, i) => {
        const series = [dateRangeSeries[i]];

        if (data.comparisonDateRange && data.comparisonDateRangeData) {
          series.push(comparisonDateRangeSeries[i]);
        }

        return {
          name: dayjs(date).utc(false).format('dddd'),
          series,
        };
      });

      return visitsByDayData;
    })
  );

  dyfData$ = this.overviewData$.pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map((data) => {
      const pieChartData: SingleSeries = [
        { name: 'Yes', value: data?.dateRangeData?.dyf_yes || 0 },
        { name: 'No', value: data?.dateRangeData?.dyf_no || 0 },
      ];

      return pieChartData;
    })
  );

  whatWasWrongData$ = this.overviewData$.pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map((data) => {
      const pieChartData: SingleSeries = [
        {
          name: 'I can’t find the info',
          value: data?.dateRangeData?.fwylf_cant_find_info || 0,
        },
        { name: 'Other reason', value: data?.dateRangeData?.fwylf_other || 0 },
        {
          name: 'Info is hard to understand',
          value: data?.dateRangeData?.fwylf_hard_to_understand || 0,
        },
        {
          name: 'Error/something didn’t work',
          value: data?.dateRangeData?.fwylf_error || 0,
        },
      ];

      return pieChartData;
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

type DateRangeDataIndexKey = keyof OverviewAggregatedData &
  keyof PickByType<OverviewAggregatedData, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<OverviewAggregatedData, number>
) {
  return map((data: OverviewData) => {
    if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
      return;
    }

    const current = data?.dateRangeData[propName as DateRangeDataIndexKey];
    const previous =
      data?.comparisonDateRangeData[propName as DateRangeDataIndexKey];

    if (!current || !previous) {
      return;
    }

    return percentChange(current, previous);
  });
}
