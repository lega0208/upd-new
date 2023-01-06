import {
  createFeatureSelector,
  createSelector,
  MemoizedSelector,
} from '@ngrx/store';
import { ApexAxisChartSeries } from 'ng-apexcharts';
import { I18nModule, I18nService } from '@dua-upd/upd/i18n';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  DateRangePeriod,
  selectComparisonDateRange,
  selectCurrentLang,
  selectDatePeriodSelection,
  selectDateRange,
  selectDateRangeLabel,
  selectPeriodDates,
} from '@dua-upd/upd/state';
import { OVERVIEW_FEATURE_KEY, OverviewState } from './overview.reducer';
import { arrayToDictionary, logJson } from '@dua-upd/utils-common';

dayjs.extend(utc);

export type DateTimeSeriesData = {
  x: string;
  y: number;
}[];

// Select full overview state
export const selectOverviewState =
  createFeatureSelector<OverviewState>(OVERVIEW_FEATURE_KEY);

// Top-level
export const selectOverviewLoaded = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.loaded
);

export const selectOverviewLoading = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.loading
);

export const selectOverviewError = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.error
);

export const selectOverviewData = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.data
);

// data select (current/previous)
export const selectCurrentData = createSelector(
  selectOverviewData,
  ({ dateRangeData }) => dateRangeData
);

export const selectComparisonData = createSelector(
  selectOverviewData,
  ({ comparisonDateRangeData }) => comparisonDateRangeData
);

export const selectCurrentDateRangeLabel = selectDateRangeLabel(
  selectCurrentData,
  selectDateRange
);

export const selectComparisonDateRangeLabel = selectDateRangeLabel(
  selectComparisonData,
  selectComparisonDateRange
);

/*
 * chart/table/component-level
 */

// Visits by day
export const selectVisitsByDay = createSelector(
  selectCurrentData,
  (data) => data?.visitsByDay || []
);
export const selectVisitsByDaySeries = createSelector(
  selectVisitsByDay,
  (visitsByDay) =>
    visitsByDay.map(({ date, visits }) => ({
      x: date,
      y: visits,
    }))
);

export const selectComparisonVisitsByDay = createSelector(
  selectComparisonData,
  (data) => data?.visitsByDay || []
);
export const selectComparisonVisitsByDaySeries = createSelector(
  selectComparisonVisitsByDay,
  selectPeriodDates,
  (visitsByDay, dates) =>
    visitsByDay
      .filter(({ date }) => dates.has(date))
      .map(({ date, visits }) => ({
        x: dates.get(date) as string,
        y: visits,
      }))
);

// Calls by day
export const selectCallsByDay = createSelector(
  selectCurrentData,
  (data) => data?.calldriversByDay || []
);
export const selectCallsByDaySeries = createSelector(
  selectCallsByDay,
  (callsByDay) =>
    callsByDay.map(({ date, calls }) => ({
      x: date,
      y: calls,
    }))
);

export const selectComparisonCallsByDay = createSelector(
  selectComparisonData,
  (data) => data?.calldriversByDay || []
);
export const selectComparisonCallsByDaySeries = createSelector(
  selectComparisonCallsByDay,
  selectPeriodDates,
  (callsByDay, dates) =>
    callsByDay
      .filter(({ date }) => dates.has(date))
      .map(({ date, calls }) => ({
        x: dates.get(date) as string,
        y: calls,
      }))
);

// Calls per 100 visits
export const selectCallsPerVisits = createSelector(
  selectCallsByDay,
  selectVisitsByDay,
  (callsByDay, visitsByDay) => {
    const callsByDateDict = arrayToDictionary(callsByDay, 'date');

    return visitsByDay
      .map(({ date, visits }) => {
        const calls = callsByDateDict[date]?.calls;

        return {
          x: date,
          y: calls ? (calls / visits) * 100 : 0,
        };
      })
      .filter(({ y }) => y);
  }
);

export const selectComparisonCallsPerVisits = createSelector(
  selectComparisonCallsByDay,
  selectComparisonVisitsByDay,
  selectPeriodDates,
  (callsByDay, visitsByDay, dates) => {
    const callsByDateDict = arrayToDictionary(callsByDay, 'date');

    return visitsByDay
      .filter(({ date }) => dates.has(date))
      .map(({ date, visits }) => {
        const calls = callsByDateDict[date]?.calls;

        return {
          x: dates.get(date) as string,
          y: calls ? (calls / visits) * 100 : 0,
        };
      })
      .filter(({ y }) => y);
  }
);

export const toCallsPerVisitsSeries =
  (label: string) =>
  (datesLabel: string, callsPerVisits: DateTimeSeriesData) => {
    const i18n = I18nModule.injector.get<I18nService>(I18nService);

    return {
      name: `${i18n.instant(label) || label} – ${datesLabel}`,
      type: 'line',
      data: callsPerVisits,
    };
  };

export const selectCallsPerVisitsSeries = createSelector(
  selectCurrentDateRangeLabel,
  selectCallsPerVisits,
  selectDatePeriodSelection,
  toCallsPerVisitsSeries('kpi-calls-per-100-title')
);

export const selectComparisonCallsPerVisitsSeries = createSelector(
  selectComparisonDateRangeLabel,
  selectComparisonCallsPerVisits,
  selectDatePeriodSelection,
  toCallsPerVisitsSeries('kpi-calls-per-100-title')
);

export const selectCallsPerVisitsChartData = createSelector(
  selectCallsPerVisitsSeries,
  selectComparisonCallsPerVisitsSeries,
  (current, comparison) => [current, comparison]
);

// comboChartData$
export const selectChartType = createSelector(
  selectDatePeriodSelection,
  (dateRangePeriod) =>
    (['weekly', 'monthly'] as DateRangePeriod[]).includes(dateRangePeriod)
      ? 'column'
      : 'line'
);

export const toVisitsCallsChartSeries =
  (visitsLabel: string, callsLabel: string) =>
  (
    label: string,
    visits: DateTimeSeriesData,
    calls: DateTimeSeriesData,
    chartType: 'column' | 'line'
  ) => {
    const i18n = I18nModule.injector.get<I18nService>(I18nService);

    const translatedVisits = i18n.instant(visitsLabel) || visitsLabel;
    const translatedCalls = i18n.instant(callsLabel) || callsLabel;

    return [
      {
        name: `${translatedVisits} – ${label}`,
        type: chartType,
        data: visits,
      },
      {
        name: `${translatedCalls} – ${label}`,
        type: 'line',
        data: calls,
      },
    ];
  };

export const selectCallsVisitsComboChartData = createSelector(
  selectCurrentDateRangeLabel,
  selectVisitsByDaySeries,
  selectCallsByDaySeries,
  selectChartType,
  toVisitsCallsChartSeries('visits', 'calls')
);

export const selectComparisonCallsVisitsComboChartData = createSelector(
  selectComparisonDateRangeLabel,
  selectComparisonVisitsByDaySeries,
  selectComparisonCallsByDaySeries,
  selectChartType,
  toVisitsCallsChartSeries('visits', 'calls')
);

export const selectComboChartData = createSelector(
  selectCallsVisitsComboChartData,
  selectComparisonCallsVisitsComboChartData,
  // pretty hacky, but this works for now
  (data, prevData) => [data[0], prevData[0], data[1], prevData[1]]
);

export const selectVisitsByDayChartData = createSelector(
  selectCallsVisitsComboChartData,
  selectComparisonCallsVisitsComboChartData,
  // pretty hacky, but this works for now
  (data, prevData) => [data[0], prevData[0]]
);

export const selectComboChartTable = createSelector(
  selectPeriodDates,
  selectVisitsByDay,
  selectCallsByDay,
  selectComparisonVisitsByDay,
  selectComparisonCallsByDay,
  selectCurrentLang,
  selectDatePeriodSelection,
  (dates, visits, calls, prevVisits, prevCalls, lang, dateRangePeriod) => {
    const visitsDict = arrayToDictionary(visits, 'date');
    const callsDict = arrayToDictionary(calls, 'date');
    const prevVisitsDict = arrayToDictionary(prevVisits, 'date');
    const prevCallsDict = arrayToDictionary(prevCalls, 'date');

    // *** extract date/label stuff for reuse
    // potentially also colConfigs

    const dateFormat =
      dateRangePeriod === 'weekly' ? 'dddd, MMM D' : 'MMM D YYYY';

    return [...dates].map(([prevDate, currentDate]) => ({
      date: dayjs.utc(currentDate).locale(lang).format(dateFormat),
      visits: visitsDict[currentDate]?.visits,
      calls: callsDict[currentDate]?.calls,
      prevDate: dayjs.utc(prevDate).locale(lang).format(dateFormat),
      prevVisits: prevVisitsDict[prevDate]?.visits,
      prevCalls: prevCallsDict[prevDate]?.calls,
    }));
  }
);

export const selectVisitsByDayChartTable = createSelector(
  selectPeriodDates,
  selectVisitsByDay,
  selectComparisonVisitsByDay,
  selectCurrentLang,
  selectDatePeriodSelection,
  (dates, visits, prevVisits, lang, dateRangePeriod) => {
    const visitsDict = arrayToDictionary(visits, 'date');
    const prevVisitsDict = arrayToDictionary(prevVisits, 'date');

    const dateFormat =
      dateRangePeriod === 'weekly' ? 'dddd, MMM D' : 'MMM D YYYY';

    return [...dates].map(([prevDate, currentDate]) => ({
      date: dayjs.utc(currentDate).locale(lang).format(dateFormat),
      visits: visitsDict[currentDate]?.visits,
      prevDate: dayjs.utc(prevDate).locale(lang).format(dateFormat),
      prevVisits: prevVisitsDict[prevDate]?.visits,
    }));
  }
);
