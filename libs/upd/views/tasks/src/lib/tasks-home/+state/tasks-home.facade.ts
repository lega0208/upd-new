import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import * as TasksHomeActions from './tasks-home.actions';
import * as TasksHomeSelectors from './tasks-home.selectors';
import { I18nFacade } from '@dua-upd/upd/state';
import type { ColumnConfig } from '@dua-upd/upd-components';
import { round } from '@dua-upd/utils-common';
import type { AttachmentData } from '@dua-upd/types-common';

@Injectable()
export class TasksHomeFacade {
  private i18n = inject(I18nFacade);
  private readonly store = inject(Store);

  loaded$ = this.store.select(TasksHomeSelectors.getTasksHomeLoaded);
  tasksHomeData$ = this.store.select(TasksHomeSelectors.getTasksHomeData);

  tasksHomeTableData$ = combineLatest([
    this.tasksHomeData$,
    this.i18n.currentLang$,
  ]).pipe(
    map(([tasksHomeData]) => {
      return (tasksHomeData?.dateRangeData || []).map((row) => ({
        ...row,
        task: row.title ? row.title.replace(/\s+/g, ' ') : '',
        group: row.group || '',
        tasks_subgroup: row.subgroup || '',
        topic: row.topic || '',
        tasks_subtopic: row.subtopic || '',
        program: row.program || '',
        user_type:
          row.user_type.length > 0
            ? row.user_type.map((userType) => userType || '')
            : '',
        calls_per_100_visits:
          row.visits > 0 ? round((row.calls / row.visits) * 100, 3) || 0 : 0,
      }));
    }),
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
          field: 'tasks_subgroup',
          header: this.i18n.service.translate('tasks_subgroup', lang),
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
          field: 'tasks_subtopic',
          header: this.i18n.service.translate('tasks_subtopic', lang),
          translate: true,
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
        {
          field: 'calls_per_100_visits',
          header: this.i18n.service.translate('kpi-calls-per-100-title', lang),
          pipe: 'number',
          pipeParam: '1.3-3',
        },
      ] as ColumnConfig[];
    }),
  );

  totalTasks$ = this.tasksHomeTableData$.pipe(
    map((tasksData) => tasksData.length),
  );

  totalVisits$ = this.tasksHomeData$.pipe(
    map((tasksData) => tasksData.totalVisits || 0),
  );

  totalCalls$ = this.tasksHomeData$.pipe(
    map((tasksData) => tasksData.totalCalls || 0),
  );

  totalVisitsChange$ = this.tasksHomeData$.pipe(
    map((tasksData) => tasksData.percentChange || 0),
  );

  totalCallsChange$ = this.tasksHomeData$.pipe(
    map((tasksData) => tasksData.percentChangeCalls || 0),
  );

  error$ = this.store.select(TasksHomeSelectors.getTasksHomeError);

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(TasksHomeActions.loadTasksHomeInit());
  }
}
