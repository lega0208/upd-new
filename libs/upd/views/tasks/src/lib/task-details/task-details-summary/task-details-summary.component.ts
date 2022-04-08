import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'app-task-details-summary',
  templateUrl: './task-details-summary.component.html',
  styleUrls: ['./task-details-summary.component.css'],
})
export class TaskDetailsSummaryComponent {
  avgTaskSuccessFromLastTest$ =
    this.taskDetailsService.avgTaskSuccessFromLastTest$;
  dateFromLastTest$ = this.taskDetailsService.dateFromLastTest$;

  visits$ = this.taskDetailsService.visits$;
  visitsPercentChange$ = this.taskDetailsService.visitsPercentChange$;

  visitsByPage$ = this.taskDetailsService.visitsByPage$;
  visitsByPageCols = [
    {
      field: 'title',
      header: 'Page title',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id' },
    },
    {
      field: 'url',
      header: 'Url',
      type: 'link',
      typeParams: { link: 'url', external: true },
    },
    { field: 'visits', header: 'Visits', pipe: 'number' },
    { field: 'change', header: '% Change', pipe: 'percent' },
  ] as ColumnConfig[];

  dyfChart$ = this.taskDetailsService.dyfData$;
  whatWasWrongChart$ = this.taskDetailsService.whatWasWrongData$;

  taskSuccessByUxTest$ = this.taskDetailsService.taskSuccessByUxTest$;
  taskSuccessByUxTestCols = [
    { field: 'title', header: 'UX Test' },
    { field: '0', header: 'Project' },
    { field: 'date', header: 'Date', pipe: 'date', pipeParam: 'YYYY-MM-dd' },
    { field: 'testType', header: 'Test type' },
    { field: 'successRate', header: 'Success rate', pipe: 'percent' },
  ] as ColumnConfig[];

  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}
}
