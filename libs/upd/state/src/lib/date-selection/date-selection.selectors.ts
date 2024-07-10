import { createFeatureSelector, createSelector, Selector } from '@ngrx/store';
import {
  DATE_SELECTION_FEATURE_KEY,
  DateRangePeriod,
  DateSelectionState,
  predefinedDateRanges,
} from './date-selection.reducer';
import { selectCurrentLang } from '../i18n';
import { FR_CA } from '@dua-upd/upd/i18n';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

// Lookup the 'DateSelection' feature state managed by NgRx
export const selectDateSelectionState =
  createFeatureSelector<DateSelectionState>(DATE_SELECTION_FEATURE_KEY);

export const selectDatePeriodSelection = createSelector(
  selectDateSelectionState,
  (state: DateSelectionState) => state.periodSelection,
);

export const selectDatePeriodSelectionWithLabel = createSelector(
  selectDatePeriodSelection,
  (periodSelection) => predefinedDateRanges[periodSelection] || {
    type: 'custom',
    label: 'Custom',
  },
);

export const selectPeriodSelectionLabel = createSelector(
  selectDatePeriodSelection,
  (periodSelection) => predefinedDateRanges[periodSelection].label,
);

export const selectDateRanges = createSelector(
  selectDateSelectionState,
  (state: DateSelectionState) => ({
    dateRange: state.dateRange,
    comparisonDateRange: state.comparisonDateRange,
  }),
);

export const selectDateRange = createSelector(
  selectDateRanges,
  ({ dateRange }) => dateRange,
);

export const selectComparisonDateRange = createSelector(
  selectDateRanges,
  ({ comparisonDateRange }) => comparisonDateRange,
);

export const selectPeriodDates = createSelector(
  selectDatePeriodSelection,
  (dateRangePeriod) => predefinedDateRanges[dateRangePeriod].dates,
);

export const selectNumberOfDaysInPeriod = createSelector(
  selectPeriodDates,
  (dates) => dates.size,
);

export const selectDateRangeLabel = (
  dateRangeSelector: Selector<object, string>,
) =>
  createSelector(dateRangeSelector, selectCurrentLang, (dateRange, lang) => {
    const [startDate, endDate] = dateRange.split('/');

    const dateFormat = lang === FR_CA ? 'D MMM YYYY' : 'MMM D YYYY';
    const separator = lang === FR_CA ? ' - ' : '-';

    const formattedStartDate = dayjs
      .utc(startDate)
      .locale(lang)
      .format(dateFormat);

    const formattedEndDate = dayjs.utc(endDate).locale(lang).format(dateFormat);

    return `${formattedStartDate}${separator}${formattedEndDate}`;
  });
