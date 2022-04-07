import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';

import * as ProjectsHomeActions from './projects-home.actions';
import { ProjectsHomeState } from './projects-home.reducer';
import * as ProjectsHomeSelectors from './projects-home.selectors';

@Injectable()
export class ProjectsHomeFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(
    select(ProjectsHomeSelectors.getProjectsHomeLoaded)
  );
  projectsHomeData$ = this.store.pipe(
    select(ProjectsHomeSelectors.getProjectsHomeData)
  );
  error$ = this.store.pipe(select(ProjectsHomeSelectors.getProjectsHomeError));

  constructor(private readonly store: Store) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(ProjectsHomeActions.loadProjectsHomeInit());
  }
}
