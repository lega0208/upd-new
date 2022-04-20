import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, debounceTime, map } from 'rxjs';

import dayjs from 'dayjs/esm';
import utc from 'dayjs/esm/plugin/utc';
import 'dayjs/esm/locale/en-ca';
import 'dayjs/esm/locale/fr-ca';

import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';
import { LocaleId } from '@cra-arc/upd/i18n';
import { OverviewAggregatedData, OverviewData } from '@cra-arc/types-common';
import { percentChange, PickByType } from '@cra-arc/utils-common';
import * as OverviewActions from './overview.actions';
import * as OverviewSelectors from './overview.selectors';
import { OverviewState } from './overview.reducer';
import { I18nFacade } from '@cra-arc/upd/state';

dayjs.extend(utc);

@Injectable()
export class OverviewFacade {
  currentLang$ = this.i18n.currentLang$;
  loaded$ = this.store.pipe(select(OverviewSelectors.getOverviewLoaded));
  loading$ = this.store.pipe(
    select(OverviewSelectors.getOverviewLoading),
    debounceTime(500)
  );
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
    map((overviewData) => overviewData?.dateRangeData?.position)
  );
  avgRankPercentChange$ = this.overviewData$.pipe(
    mapToPercentChange('position')
  );

  topPagesVisited$ = this.overviewData$.pipe(
    map((data) => data?.dateRangeData?.topPagesVisited || [])
  );

  topPagesVisitedWithPercentChange$ = this.overviewData$.pipe(
    mapObjectArraysWithPercentChange('topPagesVisited', 'visits')
  );

  top10GSC$ = this.overviewData$.pipe(
    map((data) => data?.dateRangeData?.top10GSC)
  );

  isChartDataOver31Days$ = this.overviewData$.pipe(
    map((data) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const days = visitsByDay?.length || 0;

      return days > 31;
    })
  );

  // todo: reorder bars? (grey then blue instead of blue then grey?)
  //  also clean this up a bit, simplify logic instead of doing everything twice
  visitsByDay$ = combineLatest([this.overviewData$, this.currentLang$]).pipe(
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

      const isCurrZero = visitsByDay?.every((v) => v.visits === 0);
      const isPrevZero = comparisonVisitsByDay.every((v) => v.visits === 0);

      if (!visitsByDay || (isCurrZero && isPrevZero)) {
        return [] as MultiSeries;
      }

      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange, lang);

      const dateRangeDates = visitsByDay.map(({ date }) => date);

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
              name: comparisonDateRangeLabel,
              value: 0,
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
              name: dateRangeLabel,
              value: 0,
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

      let visitsByDayData: MultiSeries = [];

      if (maxDays > 31) {

        // visitsByDayData = [
        //   {
        //     name: data?.dateRange,
        //     series: visitsByDay.map(({ visits, date }) => ({
        //       name: dayjs(date).utc(false).locale(lang).format(dateFormat), // todo: date label (x-axis) formatting based on date range length
        //       value: visits || 0,
        //     })),
        //   },
        // ];

        // if (
        //   data?.comparisonDateRangeData &&
        //   typeof data?.comparisonDateRange === 'string'
        // ) {
        //   visitsByDayData.push({
        //     name: data?.comparisonDateRange,
        //     series: visitsByDay.map(({ date }, idx) => ({
        //       name: dayjs(date).utc(false).locale(lang).format(dateFormat),
        //       value: comparisonVisitsByDay[idx]?.visits || 0,
        //     })),
        //   });
        // }


        visitsByDayData = [
          {
            name: data?.dateRange,
            series: dateRangeSeries.map(({ value }, i) => ({
              name: dayjs(dateRangeDates[i]).utc(false).locale(lang).format(dateFormat),
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
              name: dayjs(dateRangeDates[i]).utc(false).locale(lang).format(dateFormat),
              value: value || 0,
            })),
          });
        }
      } else {
        visitsByDayData = dateRangeDates.map((date, i) => {
          const series = [dateRangeSeries[i]];

          if (comparisonDateRangeSeries[i] !== undefined) {
            series.push(comparisonDateRangeSeries[i]);
          }

          return {
            name: dayjs(date).utc(false).locale(lang).format(dateFormat),
            series,
          };
        });
      }

      return visitsByDayData;
    })
  );

  // todo: reorder bars? (grey then blue instead of blue then grey?)
  //  also clean this up a bit, simplify logic instead of doing everything twice
  barTable$ = combineLatest([this.overviewData$, this.currentLang$]).pipe(
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

      const dateRangeSeries = visitsByDay.map(({ date, visits }) => ({
        date,
        visits,
      }));
      const comparisonDateRangeSeries = comparisonVisitsByDay.map(
        ({ visits }) => ({
          visits,
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

      const dateRangeDates = dateRangeSeries.map(({ date }) => date);

      const visitsByDayData = dateRangeDates.map((date, i) => {
        return {
          name: dayjs(date).utc(false).locale(lang).format(dateFormat),
          currValue: dateRangeSeries[i]?.visits || 0,
          prevValue: comparisonDateRangeSeries[i]?.visits || 0,
        };
      });

      return visitsByDayData;
    })
  );

  dateRangeLabel$ = combineLatest([this.overviewData$, this.currentLang$]).pipe(
    map(([data, lang]) => getWeeklyDatesLabel(data.dateRange, lang))
  );

  comparisonDateRangeLabel$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) =>
      getWeeklyDatesLabel(data.comparisonDateRange || '', lang)
    )
  );

  dyfData$ = combineLatest([this.overviewData$, this.currentLang$]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const yes = this.i18n.service.translate('yes', lang);
      const no = this.i18n.service.translate('no', lang);

      const pieChartData: SingleSeries = [
        { name: yes, value: data?.dateRangeData?.dyf_yes || 0 },
        { name: no, value: data?.dateRangeData?.dyf_no || 0 },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  whatWasWrongData$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
  ]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const cantFindInfo = this.i18n.service.translate(
        'd3-cant-find-info',
        lang
      );
      const otherReason = this.i18n.service.translate('d3-other', lang);
      const hardToUnderstand = this.i18n.service.translate(
        'd3-hard-to-understand',
        lang
      );
      const error = this.i18n.service.translate('d3-error', lang);

      const pieChartData: SingleSeries = [
        {
          name: cantFindInfo,
          value: data?.dateRangeData?.fwylf_cant_find_info || 0,
        },
        { name: otherReason, value: data?.dateRangeData?.fwylf_other || 0 },
        {
          name: hardToUnderstand,
          value: data?.dateRangeData?.fwylf_hard_to_understand || 0,
        },
        {
          name: error,
          value: data?.dateRangeData?.fwylf_error || 0,
        },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  error$ = this.store.pipe(select(OverviewSelectors.getOverviewError));

  constructor(
    private readonly store: Store<OverviewState>,
    private i18n: I18nFacade
  ) {}

  init() {
    this.store.dispatch(OverviewActions.init());
  }
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

const getMonthlyDays = (date: Date) => {
  return dayjs(date).utc(false).daysInMonth();
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

function mapObjectArraysWithPercentChange(
  propName: keyof OverviewAggregatedData,
  propPath: string
) {
  return map((data: OverviewData) => {
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
