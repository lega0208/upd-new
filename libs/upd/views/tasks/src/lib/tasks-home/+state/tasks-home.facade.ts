import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { map } from 'rxjs';

import { TasksHomeState } from './tasks-home.reducer';
import * as TasksHomeActions from './tasks-home.actions';
import * as TasksHomeSelectors from './tasks-home.selectors';

@Injectable()
export class TasksHomeFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(select(TasksHomeSelectors.getTasksHomeLoaded));
  tasksHomeData$ = this.store.pipe(select(TasksHomeSelectors.getTasksHomeData));
  tasksHomeTableData$ = this.tasksHomeData$.pipe(
    map((tasksHomeData) => tasksHomeData?.dateRangeData || [])
  );
  error$ = this.store.pipe(select(TasksHomeSelectors.getTasksHomeError));

  constructor(private readonly store: Store<TasksHomeState>) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(TasksHomeActions.loadTasksHomeInit());
  }
}
