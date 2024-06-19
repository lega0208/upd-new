import { inject, runInInjectionContext } from '@angular/core';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { I18nModule, I18nService } from '@dua-upd/upd/i18n';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  selectComparisonDateRange,
  selectCurrentLang,
  selectDatePeriodSelection,
  selectDateRange,
  selectDateRangeLabel,
  selectNumberOfDaysInPeriod,
  selectPeriodDates,
} from '@dua-upd/upd/state';
import { OVERVIEW_FEATURE_KEY, type OverviewState } from './overview.reducer';
import {
  arrayToDictionary,
  arrayToDictionaryMultiref,
} from '@dua-upd/utils-common';

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
  (state: OverviewState) => state.loaded,
);

export const selectOverviewLoading = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.loading,
);

export const selectOverviewError = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.error,
);

export const selectOverviewData = createSelector(
  selectOverviewState,
  (state: OverviewState) => state.data,
);

// data select (current/previous)
export const selectCurrentData = createSelector(
  selectOverviewData,
  ({ dateRangeData }) => dateRangeData,
);

export const selectComparisonData = createSelector(
  selectOverviewData,
  ({ comparisonDateRangeData }) => comparisonDateRangeData,
);

export const selectCurrentDateRangeLabel =
  selectDateRangeLabel(selectDateRange);

export const selectComparisonDateRangeLabel = selectDateRangeLabel(
  selectComparisonDateRange,
);

/*
 * chart/table/component-level
 */

// Feedback - most relevant comments/words
export const selectFeedbackMostRelevant = createSelector(
  selectOverviewData,
  (data) => data?.mostRelevantCommentsAndWords,
);

// Visits by day
export const selectVisitsByDay = createSelector(
  selectCurrentData,
  (data) => data?.visitsByDay || [],
);

export const selectVisitsByDaySeries = createSelector(
  selectVisitsByDay,
  (visitsByDay) =>
    visitsByDay.map(({ date, visits }) => ({
      x: date,
      y: visits,
    })),
);

export const selectVisitsByDayDict = createSelector(
  selectVisitsByDay,
  (visitsByDay) => arrayToDictionary(visitsByDay, 'date'),
);

export const selectAnnotations = createSelector(
  selectCurrentData,
  (data) => data?.annotations || [],
);

export const selectAnnotationsSeries = createSelector(
  selectAnnotations,
  selectCurrentLang,
  selectVisitsByDayDict,
  (annotations, lang, visitsDict) => {
    const maxY = Math.max(
      ...Object.values(visitsDict).map(({ visits }) => visits),
    );
    const defaultY = maxY * 0.25;

    return annotations.map(({ event_date, title, title_fr, event_type }) => ({
      x: new Date(event_date),
      y: visitsDict[event_date]?.visits || defaultY,
      text: lang == 'en-CA' ? title : title_fr,
    }));
  },
);

export const selectComparisonVisitsByDay = createSelector(
  selectComparisonData,
  (data) => data?.visitsByDay || [],
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
      })),
);

// Calls by day
export const selectCallsByDay = createSelector(
  selectCurrentData,
  (data) => data?.calldriversByDay || [],
);
export const selectCallsByDaySeries = createSelector(
  selectCallsByDay,
  (callsByDay) =>
    callsByDay.map(({ date, calls }) => ({
      x: date,
      y: calls,
    })),
);

export const selectComparisonCallsByDay = createSelector(
  selectComparisonData,
  (data) => data?.calldriversByDay || [],
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
      })),
);

export const selectComparisonAnnotations = createSelector(
  selectComparisonData,
  (data) => data?.annotations || [],
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
  },
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
  },
);

export const toCallsPerVisitsSeries =
  (label: string) =>
  (datesLabel: string, callsPerVisits: DateTimeSeriesData) => {
    return runInInjectionContext(I18nModule.injector, () => {
      const i18n = inject(I18nService, { host: true, optional: true });

      return {
        name: `${i18n?.instant(label) || label} – ${datesLabel}`,
        type: 'line',
        data: callsPerVisits,
      };
    });
  };

export const selectCallsPerVisitsSeries = createSelector(
  selectCurrentDateRangeLabel,
  selectCallsPerVisits,
  selectDatePeriodSelection,
  toCallsPerVisitsSeries('kpi-calls-per-100-title'),
);

export const selectComparisonCallsPerVisitsSeries = createSelector(
  selectComparisonDateRangeLabel,
  selectComparisonCallsPerVisits,
  selectDatePeriodSelection,
  toCallsPerVisitsSeries('kpi-calls-per-100-title'),
);

export const selectCallsPerVisitsChartData = createSelector(
  selectCallsPerVisitsSeries,
  selectComparisonCallsPerVisitsSeries,
  (current, comparison) => [comparison, current],
);

// comboChartData$
export const selectChartType = createSelector(
  selectNumberOfDaysInPeriod,
  (numDays) => (numDays <= 31 ? 'column' : 'line'),
);

export const toVisitsCallsChartSeries =
  (visitsLabel: string, callsLabel: string) =>
  (
    label: string,
    visits: DateTimeSeriesData,
    calls: DateTimeSeriesData,
    chartType: 'column' | 'line',
  ) => {
    return runInInjectionContext(I18nModule.injector, () => {
      const i18n = inject(I18nService, { host: true, optional: true });

      const translatedVisits = i18n?.instant(visitsLabel) || visitsLabel;
      const translatedCalls = i18n?.instant(callsLabel) || callsLabel;

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
    });
  };

export const selectCallsVisitsComboChartData = createSelector(
  selectCurrentDateRangeLabel,
  selectVisitsByDaySeries,
  selectCallsByDaySeries,
  selectChartType,
  toVisitsCallsChartSeries('visits', 'calls'),
);

export const selectComparisonCallsVisitsComboChartData = createSelector(
  selectComparisonDateRangeLabel,
  selectComparisonVisitsByDaySeries,
  selectComparisonCallsByDaySeries,
  selectChartType,
  toVisitsCallsChartSeries('visits', 'calls'),
);

export const selectComboChartData = createSelector(
  selectCallsVisitsComboChartData,
  selectComparisonCallsVisitsComboChartData,
  // pretty hacky, but this works for now
  (data, prevData) => [data[0], prevData[0], data[1], prevData[1]],
);

export const selectVisitsByDayChartData = createSelector(
  selectCallsVisitsComboChartData,
  selectComparisonCallsVisitsComboChartData,
  // pretty hacky, but this works for now
  (data, prevData) => [data[0], prevData[0]],
);

export const selectComboChartTable = createSelector(
  selectPeriodDates,
  selectVisitsByDay,
  selectCallsByDay,
  selectComparisonVisitsByDay,
  selectComparisonCallsByDay,
  selectAnnotations,
  selectComparisonAnnotations,
  selectCurrentLang,
  selectDatePeriodSelection,
  (
    dates,
    visits,
    calls,
    prevVisits,
    prevCalls,
    annotations,
    prevAnnotations,
    lang,
    dateRangePeriod,
  ) => {
    const visitsDict = arrayToDictionary(visits, 'date');
    const callsDict = arrayToDictionary(calls, 'date');
    const annotationsDict = arrayToDictionaryMultiref(
      annotations,
      'event_date',
    );
    const prevVisitsDict = arrayToDictionary(prevVisits, 'date');
    const prevCallsDict = arrayToDictionary(prevCalls, 'date');

    const dateFormat =
      dateRangePeriod === 'week' ? 'dddd, MMM D' : 'MMM D YYYY';

    return [...dates].map(([prevDate, currentDate]) => ({
      date: dayjs.utc(currentDate).locale(lang).format(dateFormat),
      visits: visitsDict[currentDate]?.visits,
      calls: callsDict[currentDate]?.calls,
      annotations: `${annotationsDict[currentDate]?.map((ann) => ann.title) || ''}`,
      prevDate: dayjs.utc(prevDate).locale(lang).format(dateFormat),
      prevVisits: prevVisitsDict[prevDate]?.visits,
      prevCalls: prevCallsDict[prevDate]?.calls,
    }));
  },
);

export const selectVisitsByDayChartTable = createSelector(
  selectPeriodDates,
  selectVisitsByDay,
  selectComparisonVisitsByDay,
  selectAnnotations,
  selectComparisonAnnotations,
  selectCurrentLang,
  selectDatePeriodSelection,
  (
    dates,
    visits,
    prevVisits,
    annotations,
    prevAnnotations,
    lang,
    dateRangePeriod,
  ) => {
    const visitsDict = arrayToDictionary(visits, 'date');
    const annotationsDict = arrayToDictionaryMultiref(
      annotations,
      'event_date',
    );
    const prevVisitsDict = arrayToDictionary(prevVisits, 'date');
    const prevAnnotationsDict = arrayToDictionaryMultiref(
      prevAnnotations,
      'event_date',
    );

    const dateFormat =
      dateRangePeriod === 'week' ? 'dddd, MMM D' : 'MMM D YYYY';

    return [...dates].map(([prevDate, currentDate]) => ({
      date: dayjs.utc(currentDate).locale(lang).format(dateFormat),
      visits: visitsDict[currentDate]?.visits,
      annotations: `${annotationsDict[currentDate]?.map((ann) => ann.title) || ''} ${
        annotationsDict[currentDate]?.map((ann) => ann.event_type) || ''
      }`,
      prevDate: dayjs.utc(prevDate).locale(lang).format(dateFormat),
      prevVisits: prevVisitsDict[prevDate]?.visits,
      prevAnnotations: `${prevAnnotationsDict[prevDate]?.map((ann) => ann.title) || ''} ${
        prevAnnotationsDict[prevDate]?.map((ann) => ann.event_type) || ''
      }`,
    }));
  },
);

// Feedback to visits ratio
export const selectDyfNoPerVisitsSeries = createSelector(
  selectOverviewData,
  selectCurrentDateRangeLabel,
  selectComparisonDateRangeLabel,
  selectPeriodDates,
  (
    { dateRangeData, comparisonDateRangeData },
    dateRangeLabel,
    comparisonDateRangeLabel,
    dates,
  ) => {
    const dyfByDay = dateRangeData?.dyfByDay || [];
    const visitsByDay = dateRangeData?.visitsByDay || [];
    const dyfDict = arrayToDictionary(dyfByDay, 'date');

    const dyfNoPerVisitsSeries = visitsByDay.map(({ date, visits }) => ({
      x: date,
      y: visits ? ((dyfDict[date]?.dyf_no || 0) / visits) * 1000 : NaN,
    }));

    const comparisonDyfByDay = comparisonDateRangeData?.dyfByDay || [];
    const comparisonVisitsByDay = comparisonDateRangeData?.visitsByDay || [];
    const comparisonDyfDict = arrayToDictionary(comparisonDyfByDay, 'date');

    const comparisonDyfNoPerVisitsSeries = comparisonVisitsByDay
      .filter(({ date }) => dates.has(date))
      .map(({ date, visits }) => {
        const currentDate = dates.get(date);

        return {
          x: currentDate,
          y:
            visits && currentDate
              ? ((comparisonDyfDict[date]?.dyf_no || 0) / visits) * 1000
              : NaN,
        };
      });

    return [
      {
        name: comparisonDateRangeLabel,
        type: 'line',
        data: comparisonDyfNoPerVisitsSeries,
      },
      {
        name: dateRangeLabel,
        type: 'line',
        data: dyfNoPerVisitsSeries,
      },
    ];
  },
);
