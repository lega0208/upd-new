import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  TASKS_DETAILS_FEATURE_KEY,
  TasksDetailsState,
} from './tasks-details.reducer';
import {
  selectCurrentLang,
  selectComparisonDateRange,
  selectDatePeriodSelection,
  selectDateRange,
  selectDateRangeLabel,
  selectPeriodDates,
} from '@dua-upd/upd/state';
import { arrayToDictionary, logJson } from '@dua-upd/utils-common';
import { I18nModule, I18nService } from '@dua-upd/upd/i18n';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { is } from 'rambdax';

dayjs.extend(utc);

export type DateTimeSeriesData = {
  x: string;
  y: number;
}[];

// Lookup the 'TasksDetails' feature state managed by NgRx
export const selectTasksDetailsState = createFeatureSelector<TasksDetailsState>(
  TASKS_DETAILS_FEATURE_KEY,
);

export const selectTasksDetailsLoaded = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.loaded,
);

export const selectTasksDetailsLoading = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.loading,
);

export const selectTasksDetailsError = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.error,
);

export const selectTasksDetailsData = createSelector(
  selectTasksDetailsState,
  (state: TasksDetailsState) => state.data,
);

export const selectTasksDetailsDataWithI18n = createSelector(
  selectTasksDetailsData,
  selectCurrentLang,
  (data, lang) => [data, lang] as const,
);

// data select (current/previous)
export const selectCurrentData = createSelector(
  selectTasksDetailsData,
  ({ dateRangeData }) => dateRangeData,
);

export const selectComparisonData = createSelector(
  selectTasksDetailsData,
  ({ comparisonDateRangeData }) => comparisonDateRangeData,
);

export const selectCurrentDateRangeLabel =
  selectDateRangeLabel(selectDateRange);

export const selectComparisonDateRangeLabel = selectDateRangeLabel(
  selectComparisonDateRange,
);

export const selectTaskId = createSelector(
  selectTasksDetailsData,
  (data) => data?._id,
);

export const selectFeedbackMostRelevant = createSelector(
  selectTasksDetailsData,
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
  (current, comparison) => {
    const isCurrentEmpty = current.data.every(({ y }) => y === 0);
    const isComparisonEmpty = comparison.data.every(({ y }) => y === 0);

    if (isCurrentEmpty && isComparisonEmpty) {
      return [];
    }

    return [comparison, current];
  },
);

// Feedback to visits ratio
export const selectDyfNoPerVisitsSeries = createSelector(
  selectTasksDetailsData,
  selectCurrentDateRangeLabel,
  selectComparisonDateRangeLabel,
  selectPeriodDates,
  (
    { dateRangeData, comparisonDateRangeData },
    dateRangeLabel,
    comparisonDateRangeLabel,
    dates,
  ) => {
    const dyfByDay = dateRangeData?.dyfNoPerVisits || [];

    const dyfNoPerVisitsSeries = dyfByDay.map(({ date, value }) => ({
      x: date,
      y: value ? value * 1000 : NaN,
    }));

    // const comparisonDyfByDay = comparisonDateRangeData?.dyfByDay || [];
    const comparisonVisitsByDay = comparisonDateRangeData?.visitsByDay || [];
    // const comparisonDyfDict = arrayToDictionary(comparisonDyfByDay, 'date');

    const comparisonDyfNoPerVisitsSeries = comparisonVisitsByDay
      .filter(({ date }) => dates.has(date))
      .map(({ date, visits, dyfNo }) => {
        const currentDate = dates.get(date);

        return {
          x: currentDate,
          y:
            visits && currentDate
              ? ((dyfNo || 0) / visits) * 1000
              : NaN,
        };
      });

    const isDyfNoPerVisitsEmpty = dyfNoPerVisitsSeries.every(
      ({ y }) => y === 0 || isNaN(y),
    );
    const isComparisonDyfNoPerVisitsEmpty =
      comparisonDyfNoPerVisitsSeries.every(({ y }) => y === 0 || isNaN(y));

    if (isDyfNoPerVisitsEmpty && isComparisonDyfNoPerVisitsEmpty) {
      return [];
    }

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
