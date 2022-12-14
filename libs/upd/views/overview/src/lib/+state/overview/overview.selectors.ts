import { createFeatureSelector, createSelector, Selector } from '@ngrx/store';
import { ApexAxisChartSeries } from 'ng-apexcharts';
import { FR_CA, I18nModule, I18nService, LocaleId } from '@dua-upd/upd/i18n';
import dayjs from 'dayjs';
import {
  DateRangePeriod,
  selectComparisonDateRange,
  selectCurrentLang,
  selectDatePeriodSelection,
  selectDateRange, selectDateRangeLabel,
  selectPeriodDates,
} from '@dua-upd/upd/state';
import { OVERVIEW_FEATURE_KEY, OverviewState } from './overview.reducer';

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

// comboChartData$
export const selectComboChartType = createSelector(
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
    ] as ApexAxisChartSeries;
  };

export const selectCallsVisitsComboChartData = createSelector(
  selectCurrentDateRangeLabel,
  selectVisitsByDaySeries,
  selectCallsByDaySeries,
  selectComboChartType,
  toVisitsCallsChartSeries('visits', 'calls')
);

export const selectComparisonCallsVisitsComboChartData = createSelector(
  selectComparisonDateRangeLabel,
  selectComparisonVisitsByDaySeries,
  selectComparisonCallsByDaySeries,
  selectComboChartType,
  toVisitsCallsChartSeries('visits', 'calls')
);

export const selectComboChartData = createSelector(
  selectCallsVisitsComboChartData,
  selectComparisonCallsVisitsComboChartData,
  // pretty hacky, but this works for now
  (data, prevData) => [data[0], prevData[0], data[1], prevData[1]]
);
