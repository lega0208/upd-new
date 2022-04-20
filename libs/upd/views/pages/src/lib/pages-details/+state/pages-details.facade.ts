import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { map, debounceTime, combineLatest } from 'rxjs';

import { percentChange } from '@cra-arc/utils-common';
import type { PickByType } from '@cra-arc/utils-common';
import { PagesDetailsState } from './pages-details.reducer';
import { PageAggregatedData, PageDetailsData } from '@cra-arc/types-common';
import * as PagesDetailsActions from './pages-details.actions';
import * as PagesDetailsSelectors from './pages-details.selectors';
import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';
import dayjs from 'dayjs/esm';
import utc from 'dayjs/esm/plugin/utc';
import 'dayjs/esm/locale/en-ca';
import 'dayjs/esm/locale/fr-ca';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';

dayjs.extend(utc);

@Injectable()
export class PagesDetailsFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(
    select(PagesDetailsSelectors.selectPagesDetailsLoaded)
  );
  loading$ = this.store.pipe(
    select(PagesDetailsSelectors.getPagesDetailsLoading),
    debounceTime(500)
  );
  startSession$ = this.store.pipe(
    select(PagesDetailsSelectors.getPagesDetailsStartSession)
  );
  pagesDetailsData$ = this.store.pipe(
    select(PagesDetailsSelectors.selectPagesDetailsData)
  );

  currentLang$ = this.i18n.currentLang$;

  pageTitle$ = this.pagesDetailsData$.pipe(map((data) => data?.title));
  pageUrl$ = this.pagesDetailsData$.pipe(map((data) => data?.url));

  visitors$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visitors)
  );
  visitorsPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('visitors')
  );

  visits$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visits)
  );
  visitsPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('visits')
  );

  pageViews$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.views)
  );
  pageViewsPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('views')
  );

  impressions$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gsc_total_impressions)
  );
  impressionsPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('gsc_total_impressions')
  );

  ctr$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gsc_total_ctr)
  );
  ctrPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('gsc_total_ctr')
  );

  avgRank$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gsc_total_position)
  );
  avgRankPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('gsc_total_position')
  );

  visitsByDay$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const comparisonVisitsByDay =
        data?.comparisonDateRangeData?.visitsByDay || [];
      const days = visitsByDay?.length || 0;
      const prevDays = comparisonVisitsByDay?.length || 0;
      const maxDays = Math.max(days, prevDays);
      const granularity = Math.ceil(days / 7);
      const dateFormat = granularity > 1 ? 'MMM D' : 'dddd';
      let [startDate] = data.dateRange.split('/').map((d) => new Date(d));
      let [prevStartDate] = (data.comparisonDateRange || '')
        .split('/')
        .map((d) => new Date(d));

      if (!visitsByDay) {
        return [] as MultiSeries;
      }

      const isCurrZero = visitsByDay.every((v) => v.visits === 0);
      const isPrevZero = comparisonVisitsByDay.every((v) => v.visits === 0);

      if (isCurrZero && isPrevZero) {
        return [] as MultiSeries;
      }

      const dateRangeDates = visitsByDay.map(({ date }) => date);
      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange, lang);

      const dateRangeSeries = visitsByDay.map(({ visits }, i) => ({
        name: dateRangeLabel, // todo: date label (x-axis) formatting based on date range length
        value: visits || 0,
      }));

      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange || '',
        lang
      );

      const comparisonDateRangeSeries = comparisonVisitsByDay.map(
        ({ visits }) => ({
          name: comparisonDateRangeLabel,
          value: visits || 0,
        })
      );

      let dayCount = 0;

      while (dayCount < maxDays) {
        const prevMonthDays = getMonthlyDays(prevStartDate);
        const currMonthDays = getMonthlyDays(startDate);

        if (currMonthDays > prevMonthDays) {
          // if the current month has more days than the previous month,
          // we need to pad the previous month with zeros

          const daysToPad = currMonthDays - prevMonthDays;
          comparisonDateRangeSeries.splice(
            dayCount + prevMonthDays,
            0,
            ...Array(daysToPad).fill({
              date: '*',
              visits: 0,
            })
          );

          dayCount += currMonthDays;
        } else {
          // if the current month has less days than the previous month,
          // we need to pad the current month with zeros

          const daysToPad = prevMonthDays - currMonthDays;

          dateRangeSeries.splice(
            dayCount + currMonthDays,
            0,
            ...Array(daysToPad).fill({
              date: '*',
              visits: 0,
            })
          );

          dayCount += prevMonthDays;
        }

        prevStartDate = dayjs(prevStartDate)
          .utc(false)
          .add(1, 'month')
          .toDate();
        startDate = dayjs(startDate).utc(false).add(1, 'month').toDate();
      }

      const visitsByDayData: MultiSeries = [
        {
          name: data?.dateRange,
          series: dateRangeSeries.map(({ value }, i) => ({
            name: dayjs(dateRangeDates[i])
              .utc(false)
              .locale(lang)
              .format(dateFormat),
            value: value || 0,
          })),
        },
      ];

      if (
        data?.comparisonDateRangeData &&
        typeof data?.comparisonDateRange === 'string'
      ) {
        visitsByDayData.push({
          name: data?.comparisonDateRange,
          series: comparisonDateRangeSeries.map(({ value }, i) => ({
            name: dayjs(dateRangeDates[i])
              .utc(false)
              .locale(lang)
              .format(dateFormat),
            value: value || 0,
          })),
        });
      }

      return visitsByDayData;
    })
  );

  visitsByDeviceType$ = this.pagesDetailsData$.pipe(
    // todo: utility function for converting to MultiSeries/other chart types
    map((data) => {
      const dataByDeviceType = [
        {
          name: 'Desktop',
          value: data?.dateRangeData?.visits_device_desktop || 0,
        },
        {
          name: 'Mobile',
          value: data?.dateRangeData?.visits_device_mobile || 0,
        },
        {
          name: 'Tablet',
          value: data?.dateRangeData?.visits_device_tablet || 0,
        },
        { name: 'Other', value: data?.dateRangeData?.visits_device_other || 0 },
      ];

      const comparisonDataByDeviceType = [
        {
          name: 'Desktop',
          value: data?.comparisonDateRangeData?.visits_device_desktop || 0,
        },
        {
          name: 'Mobile',
          value: data?.comparisonDateRangeData?.visits_device_mobile || 0,
        },
        {
          name: 'Tablet',
          value: data?.comparisonDateRangeData?.visits_device_tablet || 0,
        },
        {
          name: 'Other',
          value: data?.comparisonDateRangeData?.visits_device_other || 0,
        },
      ];

      const isCurrZero = dataByDeviceType.every((v) => v.value === 0);
      const isPrevZero = comparisonDataByDeviceType.every((v) => v.value === 0);

      if (isCurrZero && isPrevZero) {
        return [] as MultiSeries;
      }

      const barChartData: MultiSeries = [
        {
          name: data?.dateRange || '', // todo: formatted date range labels
          series: dataByDeviceType,
        },
        {
          name: data?.comparisonDateRange || '',
          series: comparisonDataByDeviceType,
        },
      ];

      return barChartData;
    })
  );

  referrerType$ = this.pagesDetailsData$.pipe(
    map((data) => {
      const dataByReferrerType = [
        {
          type: 'Other Web Sites',
          value: data?.dateRangeData?.visits_referrer_other || 0,
          change: 0,
        },
        {
          type: 'Search Engines',
          value: data?.dateRangeData?.visits_referrer_searchengine || 0,
          change: 0,
        },
        {
          type: 'Typed/Bookmarked',
          value: data?.dateRangeData?.visits_referrer_typed_bookmarked || 0,
          change: 0,
        },
        {
          type: 'Social Networks',
          value: data?.dateRangeData?.visits_referrer_social || 0,
          change: 0,
        },
      ];

      const isZero = dataByReferrerType.every((v) => v.value === 0);

      if (isZero) {
        return [] as MultiSeries;
      }

      return dataByReferrerType;
    })
  );

  visitorLocation$ = this.pagesDetailsData$.pipe(
    map((data) => {
      const dataByLocation = [
        {
          province: 'Alberta',
          value: data?.dateRangeData?.visits_geo_ab || 0,
          change: 0,
        },
        {
          province: 'British Columbia',
          value: data?.dateRangeData?.visits_geo_bc || 0,
          change: 0,
        },
        {
          province: 'Manitoba',
          value: data?.dateRangeData?.visits_geo_mb || 0,
          change: 0,
        },
        {
          province: 'New Brunswick',
          value: data?.dateRangeData?.visits_geo_nb || 0,
          change: 0,
        },
        {
          province: 'Newfoundland and Labrador',
          value: data?.dateRangeData?.visits_geo_nl || 0,
          change: 0,
        },
        {
          province: 'Nova Scotia',
          value: data?.dateRangeData?.visits_geo_ns || 0,
          change: 0,
        },
        {
          province: 'Northwest Territories',
          value: data?.dateRangeData?.visits_geo_nt || 0,
          change: 0,
        },
        {
          province: 'Nunavut',
          value: data?.dateRangeData?.visits_geo_nu || 0,
          change: 0,
        },
        {
          province: 'Ontario',
          value: data?.dateRangeData?.visits_geo_on || 0,
          change: 0,
        },
        {
          province: 'Prince Edward Island',
          value: data?.dateRangeData?.visits_geo_pe || 0,
          change: 0,
        },
        {
          province: 'Quebec',
          value: data?.dateRangeData?.visits_geo_qc || 0,
          change: 0,
        },
        {
          province: 'Sakatchewan',
          value: data?.dateRangeData?.visits_geo_sk || 0,
          change: 0,
        },
        {
          province: 'Yukon',
          value: data?.dateRangeData?.visits_geo_yt || 0,
          change: 0,
        },
        {
          province: 'Outside Canada',
          value: data?.dateRangeData?.visits_geo_outside_canada || 0,
          change: 0,
        },
      ];

      const isZero = dataByLocation.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return dataByLocation;
    })
  );

  // topPagesVisitedWithPercentChange$ = this.pagesDetailsData$.pipe(
  //   mapObjectArraysWithPercentChange('root', 'visits')
  // );

  dyfData$ = this.pagesDetailsData$.pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map((data) => {
      const pieChartData: SingleSeries = [
        { name: 'Yes', value: data?.dateRangeData?.dyf_yes || 0 },
        { name: 'No', value: data?.dateRangeData?.dyf_no || 0 },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  whatWasWrongData$ = this.pagesDetailsData$.pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map((data) => {
      const cantFindInfo = data?.dateRangeData?.fwylf_cant_find_info || 0;
      const otherReason = data?.dateRangeData?.fwylf_other || 0;
      const hardToUnderstand =
        data?.dateRangeData?.fwylf_hard_to_understand || 0;
      const error = data?.dateRangeData?.fwylf_error || 0;

      if (!cantFindInfo && !otherReason && !hardToUnderstand && !error) {
        return [] as SingleSeries;
      }
      const pieChartData: SingleSeries = [
        {
          name: 'I can’t find the info',
          value: cantFindInfo,
        },
        { name: 'Other reason', value: otherReason },
        {
          name: 'Info is hard to understand',
          value: hardToUnderstand,
        },
        {
          name: 'Error/something didn’t work',
          value: error,
        },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  topSearchTermsIncrease$ = this.pagesDetailsData$.pipe(
    map((data) => [...(data?.topSearchTermsIncrease || [])])
  );

  topSearchTermsDecrease$ = this.pagesDetailsData$.pipe(
    map((data) => [...(data?.topSearchTermsDecrease || [])])
  );

  top25GSCSearchTerms$ = this.pagesDetailsData$.pipe(
    map((data) => [...(data?.top25GSCSearchTerms || [])])
  );

  error$ = this.store.pipe(
    select(PagesDetailsSelectors.selectPagesDetailsError)
  );

  constructor(
    private readonly store: Store<PagesDetailsState>,
    private i18n: I18nFacade
  ) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(PagesDetailsActions.loadPagesDetailsInit());
  }
}

const getMonthlyDays = (date: Date) => {
  return dayjs(date).utc(false).daysInMonth();
};

type DateRangeDataIndexKey = keyof PageAggregatedData &
  keyof PickByType<PageAggregatedData, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<PageAggregatedData, number>
) {
  return map((data: PageDetailsData) => {
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

const getWeeklyDatesLabel = (dateRange: string, lang: LocaleId) => {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const formattedStartDate = dayjs(startDate)
    .utc(false)
    .locale(lang)
    .format('MMM D');
  const formattedEndDate = dayjs(endDate)
    .utc(false)
    .locale(lang)
    .format('MMM D');

  return `${formattedStartDate}-${formattedEndDate}`;
};

function mapObjectArraysWithPercentChange(
  propName: keyof PageAggregatedData,
  propPath: string
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

    const propsAreValidArrays =
      Array.isArray(current) &&
      Array.isArray(previous) &&
      current.length > 0 &&
      previous.length > 0 &&
      current.length === previous.length;

    if (propsAreValidArrays) {
      return current.map((val: any, i) => ({
        ...val,
        percentChange: percentChange(
          val[propPath],
          (previous as any)[i][propPath]
        ),
      }));
    }

    throw Error('Invalid data arrays in mapObjectArraysWithPercentChange');
  });
}
