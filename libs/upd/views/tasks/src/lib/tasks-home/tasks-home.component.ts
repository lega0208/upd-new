import { Component, inject, OnInit } from '@angular/core';
import { map } from 'rxjs';
import type { ColumnConfig } from '@dua-upd/upd-components';
import type { TasksHomeAggregatedData } from '@dua-upd/types-common';
import { TasksHomeFacade } from './+state/tasks-home.facade';

@Component({
  selector: 'upd-tasks-home',
  templateUrl: './tasks-home.component.html',
  styleUrls: ['./tasks-home.component.css'],
})
export class TasksHomeComponent implements OnInit {
  private readonly tasksHomeService = inject(TasksHomeFacade);

  loading$ = this.tasksHomeService.loaded$.pipe(map((loaded) => !loaded));

  totalTasks$ = this.tasksHomeService.totalTasks$;
  tasksHomeData$ = this.tasksHomeService.tasksHomeTableData$;
  tasksHomeColumns$ = this.tasksHomeService.tasksHomeTableColumns$;
  totalVisits$ = this.tasksHomeService.totalVisits$;
  totalVisitsChange$ = this.tasksHomeService.totalVisitsChange$;
  totalCalls$ = this.tasksHomeService.totalCalls$;
  totalCallsChange$ = this.tasksHomeService.totalCallsChange$;
  tasksReports$ = this.tasksHomeService.tasksReports$;
  tasksReportsColumns$ = this.tasksHomeService.tasksReportsColumns$;

  columns: ColumnConfig<TasksHomeAggregatedData>[] = [];
  searchFields = this.columns.map((col) => col.field);

  ngOnInit() {
    this.tasksHomeService.init();
  }
}
