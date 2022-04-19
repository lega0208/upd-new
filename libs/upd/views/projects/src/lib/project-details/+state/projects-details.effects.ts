import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createEffect, Actions, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map, of } from 'rxjs';

import * as ProjectsDetailsActions from './projects-details.actions';
import { ApiService } from '@cra-arc/upd/services';
import { Store } from '@ngrx/store';
import { selectDatePeriod, selectDateRanges, selectRouteNestedParam } from '@cra-arc/upd/state';
import { selectProjectsDetailsData } from './projects-details.selectors';
import { loadProjectsDetailsSuccess } from './projects-details.actions';

@Injectable()
export class ProjectsDetailsEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsDetailsActions.loadProjectsDetailsInit),
      concatLatestFrom(() => [
        this.store$.select(selectRouteNestedParam('id')),
        this.store$.select(selectDateRanges),
        this.store$.select(selectProjectsDetailsData),
      ]),
      mergeMap(
        ([
          ,
          projectId,
          { dateRange, comparisonDateRange },
          projectDetailsData,
        ]) => {
          if (!projectId) {
            console.error('pageId not found when trying to load page details');
          }

          const projectIsLoaded = projectDetailsData._id === projectId; // page is already loaded (but not necessarily with the correct data)
          const dateRangeIsLoaded = projectDetailsData.dateRange === dateRange; // data for the dateRange is already loaded
          const comparisonDateRangeIsLoaded =
            projectDetailsData.comparisonDateRange === comparisonDateRange;

          if (projectIsLoaded && dateRangeIsLoaded && comparisonDateRangeIsLoaded) {
            // if everything is already loaded in the state, don't update it
            return of(
              loadProjectsDetailsSuccess({ data: null })
            );
          }

          return this.api
            .getProjectsDetailsData({ id: projectId, dateRange, ...{ comparisonDateRange } })
            .pipe(
              map((data) =>
                loadProjectsDetailsSuccess({ data })
              ),
              catchError(() => EMPTY)
            );
        }
      )
    )
  );
  
  dateChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(selectDatePeriod),
      mergeMap(() => of(ProjectsDetailsActions.loadProjectsDetailsInit()))
    )
  );

  constructor(
    private readonly actions$: Actions,
    private store$: Store,
    private api: ApiService
  ) {}
}
