import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { map } from 'rxjs';

import { percentChange } from '@cra-arc/utils-common/math';
import { PickByType } from '@cra-arc/utils-common/types';
import { PagesDetailsState } from './pages-details.reducer';
import { PageAggregatedData, PageDetailsData } from './pages-details.models';
import * as PagesDetailsActions from './pages-details.actions';
import * as PagesDetailsSelectors from './pages-details.selectors';
import { MultiSeries } from '@amonsour/ngx-charts';
import dayjs from 'dayjs';

@Injectable()
export class PagesDetailsFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(
    select(PagesDetailsSelectors.selectPagesDetailsLoaded)
  );
  pagesDetailsData$ = this.store.pipe(
    select(PagesDetailsSelectors.selectPagesDetailsData)
  );

  pageTitle$ = this.pagesDetailsData$.pipe(map((data) => data?.title));
  pageUrl$ = this.pagesDetailsData$.pipe(map((data) => data?.url));

  visitors$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visitors)
  );
  visitorsPercentChange$ = this.pagesDetailsData$.pipe(mapToPercentChange('visitors'));

  visits$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visits)
  );
  visitsPercentChange$ = this.pagesDetailsData$.pipe(mapToPercentChange('visits'));

  pageViews$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.views)
  );
  pageViewsPercentChange$ = this.pagesDetailsData$.pipe(mapToPercentChange('views'));

  visitsByDay$ = this.pagesDetailsData$.pipe(
    map((data) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const comparisonVisitsByDay = data?.comparisonDateRangeData?.visitsByDay || [];

      if (!visitsByDay) {
        return [] as MultiSeries;
      }

      const visitsByDayData: MultiSeries = [
        {
          name: data?.dateRange,
          series: visitsByDay.map(({ visits, date }) => ({
            name: dayjs(date).format('ddd'), // todo: date label (x-axis) formatting based on date range length
            value: visits
          }))
        },
        {
          name: data?.comparisonDateRange,
          series: comparisonVisitsByDay.map(({ visits, date }) => ({
            name: dayjs(date).format('ddd'),
            value: visits
          }))
        }
      ];

      return visitsByDayData;
    }),
  );

  visitsByDeviceType$ = this.pagesDetailsData$.pipe(
    // todo: utility function for converting to MultiSeries/other chart types
    map((data) => {
      const dataByDeviceType = [
        { name: 'Desktop', value: data?.dateRangeData?.visits_device_desktop || 0 },
        { name: 'Mobile', value: data?.dateRangeData?.visits_device_mobile || 0 },
        { name: 'Tablet', value: data?.dateRangeData?.visits_device_tablet || 0 },
        { name: 'Other', value: data?.dateRangeData?.visits_device_other || 0 },
      ];

      const comparisonDataByDeviceType = [
        { name: 'Desktop', value: data?.comparisonDateRangeData?.visits_device_desktop || 0 },
        { name: 'Mobile', value: data?.comparisonDateRangeData?.visits_device_mobile || 0 },
        { name: 'Tablet', value: data?.comparisonDateRangeData?.visits_device_tablet || 0 },
        { name: 'Other', value: data?.comparisonDateRangeData?.visits_device_other || 0 },
      ];

      const barChartData: MultiSeries = [
        {
          name: data?.dateRange || '', // todo: formatted date range labels
          series: dataByDeviceType
        },
        {
          name: data?.comparisonDateRange || '',
          series: comparisonDataByDeviceType
        }
      ];

      return barChartData;
    })
  );

  topSearchTermsIncrease$ = this.pagesDetailsData$.pipe(
    map((data) => data?.topSearchTermsIncrease || [])
  );

  error$ = this.store.pipe(
    select(PagesDetailsSelectors.selectPagesDetailsError)
  );

  constructor(private readonly store: Store<PagesDetailsState>) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(PagesDetailsActions.loadPagesDetailsInit());
  }
}

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<PageAggregatedData, number>
) {
  return map((data: PageDetailsData) => {
    if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
      return;
    }

    const current = data?.dateRangeData[propName];
    const previous = data?.comparisonDateRangeData[propName];

    if (!current || !previous) {
      return;
    }

    return percentChange(current, previous);
  });
}
