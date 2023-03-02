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
        title: row.title ? row.title.replace(/\s+/g, ' ') : '',
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
          displayFilterOptions: true,
          displayTable: false,
        },
        {
          field: 'subgroup',
          header: this.i18n.service.translate('subgroup', lang),
          displayFilterOptions: true,
          displayTable: false,
        },
        {
          field: 'service',
          header: this.i18n.service.translate('service', lang),
          displayFilterOptions: true,
          displayTable: false,
        },
        {
          field: 'user_journey',
          header: this.i18n.service.translate('user_journey', lang),
          displayFilterOptions: true,
          displayTable: false,
        },
        {
          field: 'status',
          header: this.i18n.service.translate('status', lang),
          displayFilterOptions: true,
          displayTable: false,
        },
        {
          field: 'channel',
          header: this.i18n.service.translate('channel', lang),
          displayFilterOptions: true,
          displayTable: false,
        },
        {
          field: 'core',
          header: this.i18n.service.translate('core', lang),
          displayFilterOptions: true,
          displayTable: false,
        },
        {
          field: 'title',
          header: this.i18n.service.translate('task', lang),
          type: 'link',
          typeParam: '_id',
          translate: true,
          displayTable: true,
        },
        {
          field: 'program',
          header: this.i18n.service.translate('Program', lang),
          translate: true,
          displayFilterOptions: true,
          displayTable: true,
        },
        {
          field: 'user_type',
          header: this.i18n.service.translate('Audience', lang),
          translate: true,
          displayFilterOptions: true,
          displayTable: true,
        },
        {
          field: 'topic',
          header: this.i18n.service.translate('topic', lang),
          translate: true,
          displayFilterOptions: true,
          displayTable: true,
        },
        {
          field: 'subtopic',
          header: this.i18n.service.translate('sub-topic', lang),
          translate: true,
          displayFilterOptions: true,
          displayTable: true,
        },

        {
          field: 'sub_subtopic',
          header: this.i18n.service.translate('sub-subtopic', lang),
          translate: true,
          displayFilterOptions: true,
          displayTable: false,
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
        }
      ] as ColumnConfig[];
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
