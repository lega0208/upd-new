import { BubbleChartMultiSeries, SingleSeries } from '@amonsour/ngx-charts';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, map, tap } from 'rxjs';

import * as ProjectsDetailsActions from './projects-details.actions';
import { ProjectsDetailsState } from './projects-details.reducer';
import * as ProjectsDetailsSelectors from './projects-details.selectors';
import {
  ProjectDetailsAggregatedData,
  ProjectsDetailsData,
} from '@cra-arc/types-common';
import { percentChange, PickByType } from '@cra-arc/utils-common';
import { I18nFacade } from '@cra-arc/upd/state';

@Injectable()
export class ProjectsDetailsFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(
    select(ProjectsDetailsSelectors.selectProjectsDetailsLoaded)
  );

  projectsDetailsData$ = this.store.pipe(
    select(ProjectsDetailsSelectors.selectProjectsDetailsData)
  );

  currentLang$ = this.i18n.currentLang$;

  title$ = this.projectsDetailsData$.pipe(map((data) => data?.title));
  status$ = this.projectsDetailsData$.pipe(map((data) => data?.status));

  avgTaskSuccessFromLastTest$ = this.projectsDetailsData$.pipe(
    map((data) => data?.avgTaskSuccessFromLastTest)
  );

  dateFromLastTest$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateFromLastTest)
  );

  projectTasks$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const tasks = data?.tasks.map((task) => ({
        ...task,
        title: this.i18n.service.translate(task.title, lang) || task.title,
      }));

      return [...(tasks || [])];
    })
  );

  visits$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visits || 0)
  );
  visitsPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('visits')
  );

  visitsByPage$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visitsByPage)
  );

  visitsByPageWithPercentChange$ = this.projectsDetailsData$.pipe(
    mapObjectArraysWithPercentChange('visitsByPage', 'visits')
  );

  visitsByPageGSCWithPercentChange$ = this.projectsDetailsData$.pipe(
    mapObjectArraysWithPercentChange('visitsByPage', 'gscTotalClicks')
  );

  visitsByPageFeedbackWithPercentChange$ = this.projectsDetailsData$.pipe(
    mapObjectArraysWithPercentChange('visitsByPage', 'dyfNo')
  );

  dyfData$ = combineLatest([this.projectsDetailsData$, this.currentLang$]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
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
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
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

  gscTotalClicks$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalClicks || 0)
  );
  gscTotalClicksPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalClicks')
  );

  gscTotalImpressions$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalImpressions || 0)
  );
  gscTotalImpressionsPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalImpressions')
  );

  gscTotalCtr$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalCtr || 0)
  );
  gscTotalCtrPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalCtr')
  );

  gscTotalPosition$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalPosition || 0)
  );
  gscTotalPositionPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalPosition')
  );

  taskSuccessByUxTest$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const uxTests = data?.taskSuccessByUxTest;

      if (!uxTests) {
        return [];
      }

      return uxTests.map((uxTest) => {
        return {
          ...uxTest,
          test_type: this.i18n.service.translate(uxTest.test_type || '', lang),
          tasks: uxTest.tasks
            .split('; ')
            .map((task) => this.i18n.service.translate(task, lang) || task)
            .join('; '),
        };
      });
    })
  );

  totalParticipants$ = this.projectsDetailsData$.pipe(
    map(
      (data) =>
        data?.taskSuccessByUxTest
          ?.map((data) => data?.total_users)
          .reduce((a = 0, b = 0) => a + b, 0) || 0
    )
  );

  bubbleChart$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const taskSuccessByUxData = data?.taskSuccessByUxTest;

      const taskSeries = taskSuccessByUxData.map(
        ({ success_rate, test_type }) => {
          if (!success_rate && success_rate !== 0) {
            return null;
          }

          const i18nTestType = test_type
            ? this.i18n.service.translate(test_type, lang)
            : '';

          return {
            name: i18nTestType,
            x: i18nTestType,
            y: success_rate,
            r: 10,
          };
        }
      );

      return taskSuccessByUxData
        .map(({ tasks, test_type }, i) => {
          const series = [taskSeries[i]];

          const i18nTestType = test_type
            ? this.i18n.service.translate(test_type, lang)
            : '';

          const i18nTasks = tasks
            .split('; ')
            .map((task) => {
              return this.i18n.service.translate(task, lang) || task;
            })
            .join('; ');

          if (!series[0]) {
            return null;
          }

          return {
            name: `${i18nTasks} – ${i18nTestType}`,
            series,
          };
        })
        .filter((taskValues) => !!taskValues) as BubbleChartMultiSeries;
    }),
    tap((data) => console.log(data)),
  );

  constructor(private readonly store: Store, private i18n: I18nFacade) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(ProjectsDetailsActions.loadProjectsDetailsInit());
  }
}

type DateRangeDataIndexKey = keyof ProjectDetailsAggregatedData &
  keyof PickByType<ProjectDetailsAggregatedData, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<ProjectDetailsAggregatedData, number>
) {
  return map((data: ProjectsDetailsData) => {
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
  propName: keyof ProjectDetailsAggregatedData,
  propPath: string
) {
  return map((data: ProjectsDetailsData) => {
    if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
      return;
    }

    const current = data?.dateRangeData[propName];
    const previous = data?.comparisonDateRangeData[propName];

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
