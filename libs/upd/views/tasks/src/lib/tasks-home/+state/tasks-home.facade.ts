import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';

import { TasksHomeState } from './tasks-home.reducer';
import * as TasksHomeActions from './tasks-home.actions';
import * as TasksHomeSelectors from './tasks-home.selectors';
import { I18nFacade } from '@dua-upd/upd/state';

@Injectable()
export class TasksHomeFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(select(TasksHomeSelectors.getTasksHomeLoaded));
  tasksHomeData$ = this.store.pipe(select(TasksHomeSelectors.getTasksHomeData));
  tasksHomeTableData$ = combineLatest([
    this.tasksHomeData$,
    this.i18n.currentLang$,
  ]).pipe(
    map(([tasksHomeData, lang]) => {
      return (tasksHomeData?.dateRangeData || []).map((row) => ({
        ...row,
        title: row.title
          ? this.i18n.service.translate(row.title.replace(/\s+/g, ' '), lang)
          : '',
        group: row.group
          ? this.i18n.service.translate(row.group || '', lang)
          : '',
        topic: row.topic
          ? this.i18n.service.translate(row.topic || '', lang)
          : '',
        subtopic: row.subtopic
          ? this.i18n.service.translate(row.subtopic || '', lang)
          : '',
      }));
    })
  );
  totalTasks$ = this.tasksHomeTableData$.pipe(
    map((tasksData) => tasksData.length)
  );

  error$ = this.store.pipe(select(TasksHomeSelectors.getTasksHomeError));

  constructor(
    private readonly store: Store<TasksHomeState>,
    private i18n: I18nFacade
  ) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(TasksHomeActions.loadTasksHomeInit());
  }
}
