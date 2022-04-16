import { Injectable } from '@angular/core';
import {
  TaskDetailsAggregatedData,
  TaskDetailsData,
} from '@cra-arc/types-common';
import { select, Store } from '@ngrx/store';
import { map } from 'rxjs';

import { percentChange, PickByType } from '@cra-arc/utils-common';
import * as TasksDetailsActions from './tasks-details.actions';
import { TasksDetailsState } from './tasks-details.reducer';
import * as TasksDetailsSelectors from './tasks-details.selectors';
import { SingleSeries } from '@amonsour/ngx-charts';

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
    select(TasksDetailsSelectors.selectTasksDetailsLoading)
  );
  tasksDetailsData$ = this.store.pipe(
    select(TasksDetailsSelectors.selectTasksDetailsData)
  );

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

  dyfData$ = this.tasksDetailsData$.pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map((data) => {
      const pieChartData: SingleSeries = [
        { name: 'Yes', value: data?.dateRangeData?.dyfYes || 0 },
        { name: 'No', value: data?.dateRangeData?.dyfNo || 0 },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  whatWasWrongData$ = this.tasksDetailsData$.pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map((data) => {
      const pieChartData: SingleSeries = [
        {
          name: 'I can’t find the info',
          value: data?.dateRangeData?.fwylfCantFindInfo || 0,
        },
        { name: 'Other reason', value: data?.dateRangeData?.fwylfOther || 0 },
        {
          name: 'Info is hard to understand',
          value: data?.dateRangeData?.fwylfHardToUnderstand || 0,
        },
        {
          name: 'Error/something didn’t work',
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

  constructor(private readonly store: Store) {}

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
