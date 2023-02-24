import { Component, OnInit } from '@angular/core';
import { combineLatest, map } from 'rxjs';

import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { TasksHomeAggregatedData } from '@dua-upd/types-common';
import { TasksHomeFacade } from './+state/tasks-home.facade';
import { createCategoryConfig } from '@dua-upd/upd/utils';

@Component({
  selector: 'upd-tasks-home',
  templateUrl: './tasks-home.component.html',
  styleUrls: ['./tasks-home.component.css'],
})
export class TasksHomeComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;
  loading$ = this.tasksHomeService.loaded$.pipe(map((loaded) => !loaded));

  totalTasks$ = this.tasksHomeService.totalTasks$;
  tasksHomeData$ = this.tasksHomeService.tasksHomeTableData$;
  totalVisits$ = this.tasksHomeService.totalVisits$;

  columns: ColumnConfig<TasksHomeAggregatedData>[] = [];
  searchFields = this.columns.map((col) => col.field);

  constructor(
    private readonly tasksHomeService: TasksHomeFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    this.tasksHomeService.init();

    combineLatest([this.tasksHomeData$, this.currentLang$]).subscribe(
      ([data, lang]) => {
        this.columns = [
          {
            field: 'title',
            header: this.i18n.service.translate('task', lang),
            type: 'link',
            typeParam: '_id',
          },
          {
            field: 'program',
            header: this.i18n.service.translate('Program', lang),
            filterConfig: {
              type: 'category',
              categories: createCategoryConfig({
                i18n: this.i18n.service,
                data,
                field: 'program',
              }),
            },
          },
          {
            field: 'user_type',
            header: this.i18n.service.translate('Audience', lang),
            filterConfig: {
              type: 'category',
              categories: createCategoryConfig({
                i18n: this.i18n.service,
                data,
                field: 'user_type',
              }),
            },
          },
          {
            field: 'topic',
            header: this.i18n.service.translate('category', lang),
            filterConfig: {
              type: 'category',
              categories: createCategoryConfig({
                i18n: this.i18n.service,
                data,
                field: 'topic',
              }),
            },
          },
          {
            field: 'subtopic',
            header: this.i18n.service.translate('sub-category', lang),
            filterConfig: {
              type: 'category',
              categories: createCategoryConfig({
                i18n: this.i18n.service,
                data,
                field: 'subtopic',
              }),
            },
          },
          {
            field: 'visits',
            header: this.i18n.service.translate('visits', lang),
            pipe: 'number',
          },
        ];
      }
    );
  }
}
