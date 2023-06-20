import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  PAGES_DETAILS_FEATURE_KEY,
  PagesDetailsState,
} from './pages-details.reducer';
import {
  DateRangePeriod,
  selectComparisonDateRange,
  selectCurrentLang,
  selectDatePeriodSelection,
  selectDateRange,
  selectDateRangeLabel,
  selectPeriodDates,
} from '@dua-upd/upd/state';
import { arrayToDictionary, DateRangeType } from '@dua-upd/utils-common';
import dayjs from 'dayjs';

// Lookup the 'PagesDetails' feature state managed by NgRx
export const selectPagesDetailsState = createFeatureSelector<PagesDetailsState>(
  PAGES_DETAILS_FEATURE_KEY
);

export const selectPagesDetailsLoaded = createSelector(
  selectPagesDetailsState,
  (state: PagesDetailsState) => state.loaded
);

export const selectPagesDetailsLoading = createSelector(
  selectPagesDetailsState,
  (state: PagesDetailsState) => state.loading
);

export const selectPagesDetailsError = createSelector(
  selectPagesDetailsState,
  (state: PagesDetailsState) => state.error
);

export const selectPagesDetailsData = createSelector(
  selectPagesDetailsState,
  (state: PagesDetailsState) => state.data
);

// data select (current/previous)
export const selectCurrentData = createSelector(
  selectPagesDetailsData,
  ({ dateRangeData }) => dateRangeData
);

export const selectComparisonData = createSelector(
  selectPagesDetailsData,
  ({ comparisonDateRangeData }) => comparisonDateRangeData
);

export const selectCurrentDateRangeLabel =
  selectDateRangeLabel(selectDateRange);

export const selectComparisonDateRangeLabel = selectDateRangeLabel(
  selectComparisonDateRange
);

export const selectReadabilityData = createSelector(
  selectPagesDetailsData,
  ({ readability }) => readability
);

export const selectPageLang = createSelector(
  selectPagesDetailsData,
  ({ url }) => /canada\.ca\/(en|fr)/i.exec(url)?.[1] || 'en'
);

/*
 * chart/table/component-level
 */

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

export const selectChartType = createSelector(
  selectDatePeriodSelection,
  (dateRangePeriod) =>
    (['week', 'month'] as DateRangeType[]).includes(dateRangePeriod)
      ? 'column'
      : 'line'
);

export const selectCurrentVisitsByDayChartData = createSelector(
  selectCurrentDateRangeLabel,
  selectVisitsByDaySeries,
  selectChartType,
  (label, visits, chartType) => ({
    name: label,
    data: visits,
    type: chartType,
  })
);

export const selectComparisonVisitsByDayChartData = createSelector(
  selectComparisonDateRangeLabel,
  selectComparisonVisitsByDaySeries,
  selectChartType,
  (label, visits, chartType) => ({
    name: label,
    data: visits,
    type: chartType,
  })
);

export const selectVisitsByDayChartData = createSelector(
  selectCurrentVisitsByDayChartData,
  selectComparisonVisitsByDayChartData,
  // pretty hacky, but this works for now
  (data, prevData) => [data, prevData]
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
      dateRangePeriod === 'week' ? 'dddd, MMM D' : 'MMM D YYYY';

    return [...dates].map(([prevDate, currentDate]) => ({
      date: dayjs.utc(currentDate).locale(lang).format(dateFormat),
      visits: visitsDict[currentDate]?.visits,
      prevDate: dayjs.utc(prevDate).locale(lang).format(dateFormat),
      prevVisits: prevVisitsDict[prevDate]?.visits,
    }));
  }
);
