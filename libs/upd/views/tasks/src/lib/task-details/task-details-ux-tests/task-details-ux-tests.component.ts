import { Component, OnInit } from '@angular/core';
import { ColumnConfig, ColumnConfigPipe } from '@cra-arc/upd-components';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'app-task-details-ux-tests',
  templateUrl: './task-details-ux-tests.component.html',
  styleUrls: ['./task-details-ux-tests.component.css'],
})
export class TaskDetailsUxTestsComponent {

  taskSuccessChart$ = this.taskDetailsService.taskSuccessChart$;
  taskSuccessChartCols = [
    { field: 'name', header: 'Title' },
    { field: 'value', header: 'Success Rate', pipe: 'percent' },
  ] as ColumnConfig[];
  taskSuccessData$ = this.taskDetailsService.taskSuccessByUxTest$;

  avgTaskSuccessFromLastTest$ = this.taskDetailsService.avgTaskSuccessFromLastTest$;

  taskSuccessDataCols = [
    { field: 'title', header: 'Title' },
    { field: 'scenario', header: 'Scenario' },
    { field: 'result', header: 'Result' },
    { field: 'successRate', header: 'Result', pipe: 'percent' },
    { field: 'date', header: 'Date', pipe: 'date', pipeParam: 'MMM d, y' as ColumnConfigPipe },
  ] as ColumnConfig[];

  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}
}
