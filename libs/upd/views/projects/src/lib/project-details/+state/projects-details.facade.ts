import { SingleSeries } from '@amonsour/ngx-charts';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';

import * as ProjectsDetailsActions from './projects-details.actions';
import { ProjectsDetailsState } from './projects-details.reducer';
import * as ProjectsDetailsSelectors from './projects-details.selectors';

//mock data
import { mockProjectsDetailsData$ } from '../mock-data';
import { ProjectDetailsAggregatedData, ProjectsDetailsData } from '@cra-arc/types-common';
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

  title$ = this.projectsDetailsData$.pipe(
    map((data) => data?.title ));
  status$ = this.projectsDetailsData$.pipe(
    map((data) => data?.status ));

  avgTaskSuccessFromLastTest$ = this.projectsDetailsData$.pipe(
    map((data) => data?.avgTaskSuccessFromLastTest ));

    taskSuccessByUxTestDefault$ = combineLatest([this.projectsDetailsData$, this.currentLang$]).pipe(
      // todo: utility function for converting to SingleSeries/other chart types
      map(([data, lang]) => {
        const taskSuccessByUxTest = data?.taskSuccessByUxTest;
        
        return taskSuccessByUxTest.map(({successRate, date, tasks, testType, status}, i) => {
          return {
          successRate: successRate,
          date: date,
          tasks: tasks,
          testType: testType,
          status: status,
          title: `Task ${i+1}`,
          };
        });
      })
      );

    visits$ = this.projectsDetailsData$.pipe(
      map((data) => data?.dateRangeData?.visits)
    );
    visitsPercentChange$ = this.projectsDetailsData$.pipe(
      mapToPercentChange('visits')
    );
  
    visitsByPage$ = this.projectsDetailsData$.pipe(
      map((data) => data?.dateRangeData?.visitsByPage)
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
      map((data) => data?.dateRangeData?.gscTotalClicks)
    );
    gscTotalClicksPercentChange$ = this.projectsDetailsData$.pipe(
      mapToPercentChange('gscTotalClicks')
    );
  
    gscTotalImpressions$ = this.projectsDetailsData$.pipe(
      map((data) => data?.dateRangeData?.gscTotalImpressions)
    );
    gscTotalImpressionsPercentChange$ = this.projectsDetailsData$.pipe(
      mapToPercentChange('gscTotalImpressions')
    );
  
    gscTotalCtr$ = this.projectsDetailsData$.pipe(
      map((data) => data?.dateRangeData?.gscTotalCtr)
    );
    gscTotalCtrPercentChange$ = this.projectsDetailsData$.pipe(
      mapToPercentChange('gscTotalCtr')
    );
  
    gscTotalPosition$ = this.projectsDetailsData$.pipe(
      map((data) => data?.dateRangeData?.gscTotalPosition)
    );
    gscTotalPositionPercentChange$ = this.projectsDetailsData$.pipe(
      mapToPercentChange('gscTotalPosition')
    );

    taskSuccessByUxTest$ = this.projectsDetailsData$.pipe(
      map((data) => data?.taskSuccessByUxTest)
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