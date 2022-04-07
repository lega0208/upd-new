import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';

import * as TasksDetailsActions from './tasks-details.actions';
import { TasksDetailsState } from './tasks-details.reducer';
import * as TasksDetailsSelectors from './tasks-details.selectors';

@Injectable()
export class TasksDetailsFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(
    select(TasksDetailsSelectors.selectTasksDetailsLoaded)
  );
  tasksDetailsData$ = this.store.pipe(
    select(TasksDetailsSelectors.selectTasksDetailsData)
  );
  error$ = this.store.pipe(select(TasksDetailsSelectors.selectTasksDetailsError));

  constructor(private readonly store: Store) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(TasksDetailsActions.loadTasksDetailsInit());
  }
}
