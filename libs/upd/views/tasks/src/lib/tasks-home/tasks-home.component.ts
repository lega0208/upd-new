import { Component, OnInit } from '@angular/core';
import { combineLatest, observable } from 'rxjs';

import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { TasksHomeAggregatedData } from '@dua-upd/types-common';
import { TasksHomeFacade } from './+state/tasks-home.facade';

@Component({
  selector: 'upd-tasks-home',
  templateUrl: './tasks-home.component.html',
  styleUrls: ['./tasks-home.component.css'],
})
export class TasksHomeComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  totalTasks$ = this.tasksHomeService.totalTasks$;
  tasksHomeData$ = this.tasksHomeService.tasksHomeTableData$;

  columns: ColumnConfig<TasksHomeAggregatedData>[] = [];
  searchFields = this.columns.map((col) => col.field);

  constructor(
    private readonly tasksHomeService: TasksHomeFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    this.tasksHomeService.init();

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.columns = [
        {
          field: 'title',
          header: this.i18n.service.translate('task', lang),
          type: 'link',
          typeParam: '_id',
        },
        {
          field: 'topic',
          header: this.i18n.service.translate('category', lang),
        },
        {
          field: 'subtopic',
          header: this.i18n.service.translate('sub-category', lang),
        },
        {
          field: 'visits',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
      ];
    });
  }
}
