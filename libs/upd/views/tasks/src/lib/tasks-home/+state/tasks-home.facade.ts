import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';

import { TasksHomeState } from './tasks-home.reducer';
import * as TasksHomeActions from './tasks-home.actions';
import * as TasksHomeSelectors from './tasks-home.selectors';
import { I18nFacade } from '@dua-upd/upd/state';
import { ColumnConfig } from '@dua-upd/upd-components';

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
    map(([tasksHomeData]) => {
      return (tasksHomeData?.dateRangeData || []).map((row) => ({
        ...row,
        task: row.title ? row.title.replace(/\s+/g, ' ') : '',
        group: row.group || '',
        subgroup: row.subgroup || '',
        topic: row.topic || '',
        subtopic: row.subtopic || '',
        sub_subtopic: row.sub_subtopic || '',
        program: row.program || '',
        user_type:
          row.user_type.length > 0
            ? row.user_type.map((userType) => userType || '')
            : '',
      }));
    })
  );

  tasksHomeTableColumns$ = this.i18n.currentLang$.pipe(
    map((lang) => {
      return [
        {
          field: 'group',
          header: this.i18n.service.translate('group', lang),
          hideTable: true,
        },
        {
          field: 'subgroup',
          header: this.i18n.service.translate('subgroup', lang),
          hideTable: true,
        },
        {
          field: 'service',
          header: this.i18n.service.translate('service', lang),
          hideTable: true,
        },
        {
          field: 'user_journey',
          header: this.i18n.service.translate('user_journey', lang),
          hideTable: true,
        },
        {
          field: 'status',
          header: this.i18n.service.translate('status', lang),
          hideTable: true,
        },
        {
          field: 'channel',
          header: this.i18n.service.translate('channel', lang),
          hideTable: true,
        },
        {
          field: 'core',
          header: this.i18n.service.translate('core', lang),
          hideTable: true,
        },
        {
          field: 'task',
          header: this.i18n.service.translate('task', lang),
          type: 'link',
          typeParam: '_id',
          translate: true,
        },
        {
          field: 'program',
          header: this.i18n.service.translate('Program', lang),
          translate: true,
        },
        {
          field: 'user_type',
          header: this.i18n.service.translate('Audience', lang),
          translate: true,
        },
        {
          field: 'topic',
          header: this.i18n.service.translate('topic', lang),
          translate: true,
        },
        {
          field: 'subtopic',
          header: this.i18n.service.translate('sub-topic', lang),
          translate: true,
        },

        {
          field: 'sub_subtopic',
          header: this.i18n.service.translate('sub-subtopic', lang),
          hideTable: true,
        },
        {
          field: 'visits',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
        {
          field: 'calls',
          header: this.i18n.service.translate('calls', lang),
          pipe: 'number',
        },
      ] as ColumnConfig[];
    })
  );

  totalTasks$ = this.tasksHomeTableData$.pipe(
    map((tasksData) => tasksData.length)
  );

  totalVisits$ = this.tasksHomeTableData$.pipe(
    map((tasksData) => tasksData.reduce((a, b) => a + b.visits, 0))
  );

  totalCalls$ = this.tasksHomeTableData$.pipe(
    map((tasksData) => tasksData.reduce((a, b) => a + b.calls, 0))
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
