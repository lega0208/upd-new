import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/en-CA';
import 'dayjs/locale/fr-CA';

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
    map((overviewData) => overviewData?.dateRangeData?.position)
  );
  avgRankPercentChange$ = this.overviewData$.pipe(
    mapToPercentChange('position')
  );

  topPagesVisited$ = this.overviewData$.pipe(
    map((data) => data?.dateRangeData?.topPagesVisited || [])
  );

  top10GSC$ = this.overviewData$.pipe(
    map((data) => data?.dateRangeData?.top10GSC)
  );

  // todo: reorder bars? (grey then blue instead of blue then grey?)
  //  also clean this up a bit, simplify logic instead of doing everything twice
  visitsByDay$ = combineLatest([this.overviewData$, this.currentLang$])
    .pipe(
      map(([data, lang]) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const comparisonVisitsByDay =
        data?.comparisonDateRangeData?.visitsByDay || [];
      const days = visitsByDay?.length || 0;
      const prevDays = comparisonVisitsByDay?.length || 0;
      const maxDays = Math.max(days, prevDays);
      const granularity = Math.ceil(days / 7);
      const dateFormat = granularity > 1 ? 'MMM D' : 'dddd';

      const isCurrZero = visitsByDay?.every((v) => v.visits === 0);
      const isPrevZero = comparisonVisitsByDay.every((v) => v.visits === 0);

      if (!visitsByDay || (isCurrZero && isPrevZero)) {
        return [] as MultiSeries;
      }

      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange, lang);

      const dateRangeDates = visitsByDay.map(({ date }) => date);

      const dateRangeSeries = visitsByDay.map(({ visits }) => ({
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

      const visitsByDayData: MultiSeries = dateRangeDates.map((date, i) => {
        const series = [dateRangeSeries[i]];

        if (comparisonDateRangeSeries[i] !== undefined) {
          series.push(comparisonDateRangeSeries[i]);
        } else {
          series.push({
            name: comparisonDateRangeLabel,
            value: 0,
          });
        }

        return {
          name: dayjs(date).utc(false).locale(lang).format(dateFormat),
          series,
        };
      });

      return visitsByDayData;
    })
  );

  // todo: reorder bars? (grey then blue instead of blue then grey?)
  //  also clean this up a bit, simplify logic instead of doing everything twice
  barTable$ = combineLatest([this.overviewData$, this.currentLang$])
  .pipe(
    map(([data, lang]) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const comparisonVisitsByDay =
        data?.comparisonDateRangeData?.visitsByDay || [];
      const days = visitsByDay?.length || 0;
      const granularity = Math.ceil(days / 7);
      const dateFormat = granularity > 1 ? 'MMM D' : 'dddd';

      if (!visitsByDay) {
        return [] as MultiSeries;
      }

      const dateRangeDates = visitsByDay.map(({ date }) => date);
      const dateRangeSeries = visitsByDay.map(({ visits }) => ({
        visits,
      }));
      const comparisonDateRangeSeries = comparisonVisitsByDay.map(
        ({ visits }) => ({
          visits,
        })
      );

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

  comparisonDateRangeLabel$ = combineLatest([this.overviewData$, this.currentLang$]).pipe(
    map(([data, lang]) => getWeeklyDatesLabel(data.comparisonDateRange || '', lang))
  );

  dyfData$ = combineLatest([this.overviewData$, this.currentLang$]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const yes = this.i18n.service.translate('yes');
      const no = this.i18n.service.translate('no');

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

  whatWasWrongData$ = this.overviewData$.pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map((data) => {
      const cantFindInfo = this.i18n.service.translate('d3-cant-find-info');
      const otherReason = this.i18n.service.translate('d3-other');
      const hardToUnderstand = this.i18n.service.translate('d3-hard-to-understand');
      const error = this.i18n.service.translate('d3-error');

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

  const formattedStartDate = dayjs(startDate).utc(false).locale(lang).format('MMM D');
  const formattedEndDate = dayjs(endDate).utc(false).locale(lang).format('MMM D');

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
