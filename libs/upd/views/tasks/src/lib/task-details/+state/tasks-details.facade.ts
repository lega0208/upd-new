import { Injectable } from '@angular/core';
import {
  TaskDetailsAggregatedData,
  TaskDetailsData,
} from '@cra-arc/types-common';
import { select, Store } from '@ngrx/store';
import { combineLatest, debounceTime, map } from 'rxjs';

import { percentChange, PickByType } from '@cra-arc/utils-common';
import * as TasksDetailsActions from './tasks-details.actions';
import { TasksDetailsState } from './tasks-details.reducer';
import * as TasksDetailsSelectors from './tasks-details.selectors';
import { SingleSeries } from '@amonsour/ngx-charts';
import { I18nFacade } from '@cra-arc/upd/state';

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
  title$ = this.tasksDetailsData$.pipe(map((data) => data.title));

  avgTaskSuccessFromLastTest$ = this.tasksDetailsData$.pipe(
    map((data) => data.avgTaskSuccessFromLastTest)
  );

  dateFromLastTest$ = this.tasksDetailsData$.pipe(
    map((data) => data.dateFromLastTest)
  );

  visits$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visits)
  );
  visitsPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('visits')
  );

  visitsByPage$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visitsByPage)
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

  whatWasWrongData$ = combineLatest([this.tasksDetailsData$, this.currentLang$]).pipe(
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

  taskSuccessChart$ = combineLatest([this.tasksDetailsData$, this.currentLang$]).pipe(
    map(([data, lang]) => {

      const taskSuccessByUxTest = data?.taskSuccessByUxTest;

      if ( !taskSuccessByUxTest )
        return [];

      return taskSuccessByUxTest.map(({title, successRate}, idx) => {
        return {
          name: `UX Test: ${(idx + 1)} - ${title}`,
          value: successRate || 0,
        };
      });
    })
  );

  gscTotalClicks$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalClicks)
  );
  gscTotalClicksPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalClicks')
  );

  gscTotalImpressions$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalImpressions)
  );
  gscTotalImpressionsPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalImpressions')
  );

  gscTotalCtr$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalCtr)
  );
  gscTotalCtrPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalCtr')
  );

  gscTotalPosition$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalPosition)
  );
  gscTotalPositionPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalPosition')
  );

  taskSuccessByUxTest$ = this.tasksDetailsData$.pipe(
    map((data) => data?.taskSuccessByUxTest)
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

type DateRangeDataIndexKey = keyof TaskDetailsAggregatedData &
  keyof PickByType<TaskDetailsAggregatedData, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<TaskDetailsAggregatedData, number>
) {
  return map((data: TaskDetailsData) => {
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
