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
  tasksHomeColumns$ = this.tasksHomeService.tasksHomeTableColumns$;
  totalVisits$ = this.tasksHomeService.totalVisits$;
  totalVisitsChange$ = this.tasksHomeService.totalVisitsChange$;
  totalCalls$ = this.tasksHomeService.totalCalls$;
  totalCallsChange$ = this.tasksHomeService.totalCallsChange$

  columns: ColumnConfig<TasksHomeAggregatedData>[] = [];
  searchFields = this.columns.map((col) => col.field);

  constructor(
    private readonly tasksHomeService: TasksHomeFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    this.tasksHomeService.init();
  }
}
