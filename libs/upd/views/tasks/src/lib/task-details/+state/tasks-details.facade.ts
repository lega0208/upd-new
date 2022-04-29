import { Injectable } from '@angular/core';
import {
  TaskDetailsAggregatedData,
  TaskDetailsData,
} from '@cra-arc/types-common';
import { select, Store } from '@ngrx/store';
import { combineLatest, debounceTime, map, reduce } from 'rxjs';

import dayjs from 'dayjs/esm';
import utc from 'dayjs/esm/plugin/utc';
import 'dayjs/esm/locale/en-ca';
import 'dayjs/esm/locale/fr-ca';

import { percentChange, PickByType } from '@cra-arc/utils-common';
import * as TasksDetailsActions from './tasks-details.actions';
import { TasksDetailsState } from './tasks-details.reducer';
import * as TasksDetailsSelectors from './tasks-details.selectors';
import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';
import { I18nFacade } from '@cra-arc/upd/state';
import { FR_CA, LocaleId } from '@cra-arc/upd/i18n';

dayjs.extend(utc);

@Injectable()
export class TasksDetailsFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(
    select(TasksDetailsSelectors.selectTasksDetailsLoaded)
  );
  loading$ = this.store.pipe(
    select(TasksDetailsSelectors.selectTasksDetailsLoading),
    debounceTime(500)
  );
  tasksDetailsData$ = this.store.pipe(
    select(TasksDetailsSelectors.selectTasksDetailsData)
  );

  currentLang$ = this.i18n.currentLang$;
  title$ = this.tasksDetailsData$.pipe(
    map((data) => data.title),
    debounceTime(500)
  );

  titleHeader$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(
      ([data, lang]) =>
        data.title ? this.i18n.service.translate(data.title, lang) : data.title
    )
  );

  avgTaskSuccessFromLastTest$ = this.tasksDetailsData$.pipe(
    map((data) => data.avgTaskSuccessFromLastTest)
  );

  dateFromLastTest$ = this.tasksDetailsData$.pipe(
    map((data) => data.dateFromLastTest)
  );

  visits$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visits || 0)
  );
  visitsPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('visits')
  );

  visitsByPage$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visitsByPage)
  );

  visitsByPageWithPercentChange$ = this.tasksDetailsData$.pipe(
    mapObjectArraysWithPercentChange('visitsByPage', 'visits', '_id')
  );

  visitsByPageGSCWithPercentChange$ = this.tasksDetailsData$.pipe(
    mapObjectArraysWithPercentChange('visitsByPage', 'gscTotalClicks', '_id')
  );

  visitsByPageFeedbackWithPercentChange$ = this.tasksDetailsData$.pipe(
    mapObjectArraysWithPercentChange('visitsByPage', 'dyfNo', '_id')
  );

  dateRangeLabel$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(map(([data, lang]) => getWeeklyDatesLabel(data.dateRange, lang)));

  comparisonDateRangeLabel$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) =>
      getWeeklyDatesLabel(data.comparisonDateRange || '', lang)
    )
  );

  calldriversChart$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange || '', lang);
      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange || '',
        lang
      );

      const dataEnquiryLine = (
        data?.dateRangeData?.calldriversEnquiry || []
      ).map((d) => ({
        name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
        value: d.sum,
      }));

      const comparisonDataEnquiryLine = (
        data?.comparisonDateRangeData?.calldriversEnquiry || []
      ).map((d) => ({
        name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
        value: d.sum,
      }));

      const isCurrZero = dataEnquiryLine.every((v) => v.value === 0);
      const isPrevZero = comparisonDataEnquiryLine.every((v) => v.value === 0);

      if (isCurrZero && isPrevZero) {
        return [] as MultiSeries;
      }

      const dataEnquiryLineFinal = dataEnquiryLine.filter((v) => v.value > 0);
      const comparisonDataEnquiryLineFinal = comparisonDataEnquiryLine.filter(
        (v) => v.value > 0
      );

      const barChartData: MultiSeries = [
        {
          name: dateRangeLabel,
          series: dataEnquiryLineFinal,
        },
        {
          name: comparisonDateRangeLabel,
          series: comparisonDataEnquiryLineFinal,
        },
      ];

      return barChartData;
    })
  );

  calldriversTable$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateRange = data?.dateRangeData?.calldriversEnquiry || [];
      const comparisonDateRange =
        data?.comparisonDateRangeData?.calldriversEnquiry || [];

      const dataEnquiryLine = dateRange.map((d, i) => {
        let prevVal = NaN;
        comparisonDateRange.map((cd, i) => {
          if (d.enquiry_line === cd.enquiry_line) {
            prevVal = cd.sum;
          }
        });
        return {
          name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
          currValue: d.sum,
          prevValue: prevVal,
        };
      });

      comparisonDateRange.map((d, i) => {
        let currVal = 0;
        dateRange.map((cd, i) => {
          if (d.enquiry_line === cd.enquiry_line) {
            currVal = cd.sum;
          }
        });
        if (currVal === 0) {
          dataEnquiryLine.push({
            name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
            currValue: 0,
            prevValue: d.sum,
          });
        }
      });
      return dataEnquiryLine.filter((v) => v.currValue > 0 || v.prevValue > 0);
    })
  );

  dyfData$ = combineLatest([this.tasksDetailsData$, this.currentLang$]).pipe(
    map(([data, lang]) => {
      const yes = this.i18n.service.translate('yes', lang);
      const no = this.i18n.service.translate('no', lang);

      const pieChartData: SingleSeries = [
        { name: yes, value: data?.dateRangeData?.dyfYes || 0 },
        { name: no, value: data?.dateRangeData?.dyfNo || 0 },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  whatWasWrongData$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
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
          value: data?.dateRangeData?.fwylfCantFindInfo || 0,
        },
        { name: otherReason, value: data?.dateRangeData?.fwylfOther || 0 },
        {
          name: hardToUnderstand,
          value: data?.dateRangeData?.fwylfHardToUnderstand || 0,
        },
        {
          name: error,
          value: data?.dateRangeData?.fwylfError || 0,
        },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  taskSuccessChart$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const taskSuccessByUxTest = data?.taskSuccessByUxTest;

      if (!taskSuccessByUxTest) return [];

      return taskSuccessByUxTest.map(({ title, success_rate }, idx) => {
        return {
          name: `UX Test: ${idx + 1} - ${title}`,
          value: success_rate || 0,
        };
      });
    })
  );

  gscTotalClicks$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalClicks || 0)
  );
  gscTotalClicksPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalClicks')
  );

  gscTotalImpressions$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalImpressions || 0)
  );
  gscTotalImpressionsPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalImpressions')
  );

  gscTotalCtr$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalCtr || 0)
  );
  gscTotalCtrPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalCtr')
  );

  gscTotalPosition$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalPosition || 0)
  );
  gscTotalPositionPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalPosition')
  );

  // taskSuccessByUxTest$ = this.tasksDetailsData$.pipe(
  //   map((data) => data?.taskSuccessByUxTest)
  // );
  taskSuccessByUxTest$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateFormat = lang === FR_CA ? 'D MMM YYYY' : 'MMM DD, YYYY';
      const taskSuccessByUxTest = data?.taskSuccessByUxTest?.map((d) => ({
        ...d,
        date: dayjs.utc(d.date).locale(lang).format(dateFormat),
      }));
      return [...(taskSuccessByUxTest || [])];
      //data?.taskSuccessByUxTest)
    })
  );

  totalParticipants$ = this.tasksDetailsData$.pipe(
    map((data) =>
      data?.taskSuccessByUxTest
        ?.map((data) => data?.total_users)
        .reduce((a, b) => a + b, 0)
    )
  );

  error$ = this.store.pipe(
    select(TasksDetailsSelectors.selectTasksDetailsError)
  );

  constructor(private readonly store: Store, private i18n: I18nFacade) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(TasksDetailsActions.loadTasksDetailsInit());
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
type DateRangeDataIndexKey = keyof TaskDetailsAggregatedData &
  keyof PickByType<TaskDetailsAggregatedData, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<TaskDetailsAggregatedData, number>
) {
  return map((data: TaskDetailsData) => {
    if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
      return 0;
    }

    const current = data?.dateRangeData[propName as DateRangeDataIndexKey];
    const previous =
      data?.comparisonDateRangeData[propName as DateRangeDataIndexKey];

    if (!current || !previous) {
      return 0;
    }

    return percentChange(current, previous);
  });
}

function mapObjectArraysWithPercentChange(
  propName: keyof TaskDetailsAggregatedData,
  propPath: string,
  sortPath?: string
) {
  return map((data: TaskDetailsData) => {
    if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
      return;
    }

    const current = [...((data?.dateRangeData?.[propName] || []) as any[])];
    const previous = [
      ...((data?.comparisonDateRangeData?.[propName] || []) as any[]),
    ];

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
      const sortBy = (a: any, b: any) => {
        if (sortPath && a[sortPath] instanceof Date) {
          return a[sortPath] - b[sortPath];
        }

        if (sortPath && typeof a[sortPath] === 'string') {
          return a[sortPath].localeCompare(b[sortPath]);
        }

        return 0;
      };

      current.sort(sortBy);
      previous.sort(sortBy);

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
