import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';

import * as ProjectsDetailsActions from './projects-details.actions';
import { ProjectsDetailsState } from './projects-details.reducer';
import * as ProjectsDetailsSelectors from './projects-details.selectors';

@Injectable()
export class ProjectsDetailsFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(
    select(ProjectsDetailsSelectors.getProjectsDetailsLoaded)
  );
  projectsDetailsData$ = this.store.pipe(
    select(ProjectsDetailsSelectors.getProjectsDetailsData)
  );
  error$ = this.store.pipe(
    select(ProjectsDetailsSelectors.getProjectsDetailsError)
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
