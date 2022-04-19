import { SingleSeries } from '@amonsour/ngx-charts';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { map } from 'rxjs';

import * as ProjectsDetailsActions from './projects-details.actions';
import { ProjectsDetailsState } from './projects-details.reducer';
import * as ProjectsDetailsSelectors from './projects-details.selectors';

//mock data
import { mockProjectsDetailsData$ } from '../mock-data';

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


  title$ = mockProjectsDetailsData$.title;
  status$ = mockProjectsDetailsData$.status;

  avgTaskSuccessFromLastTest$ =
    mockProjectsDetailsData$.avgTaskSuccessFromLastTest;

  visits$ = mockProjectsDetailsData$.visits;

  visitsByPage$ = mockProjectsDetailsData$.visitsByPage;

  gscTotalClicks$ = mockProjectsDetailsData$.gscTotalClicks;

  gscTotalImpressions$ = mockProjectsDetailsData$.gscTotalImpressions;

  gscTotalCtr$ = mockProjectsDetailsData$.gscTotalCtr;

  gscTotalPosition$ = mockProjectsDetailsData$.gscTotalPosition;

  taskSuccessByUxTest$ = mockProjectsDetailsData$.taskSuccessByUxTest;

  memberList$ = mockProjectsDetailsData$.taskSuccessByUxTest;

  dyfData$: SingleSeries = [
    { name: 'Yes', value: mockProjectsDetailsData$?.dyfYes || 0 },
    { name: 'No', value: mockProjectsDetailsData$?.dyfNo || 0 },
  ];

  whatWasWrongData$: SingleSeries = [
    {
      name: 'I can’t find the info',
      value: mockProjectsDetailsData$?.fwylfCantFindInfo || 0,
    },
    {
      name: 'Other reason',
      value: mockProjectsDetailsData$?.fwylfOther || 0,
    },
    {
      name: 'Info is hard to understand',
      value: mockProjectsDetailsData$?.fwylfHardToUnderstand || 0,
    },
    {
      name: 'Error/something didn’t work',
      value: mockProjectsDetailsData$?.fwylfError || 0,
    },
  ];

  error$ = this.store.pipe(
    select(ProjectsDetailsSelectors.selectProjectsDetailsError)
  );

  constructor(private readonly store: Store) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(ProjectsDetailsActions.loadProjectsDetailsInit());
  }
}
