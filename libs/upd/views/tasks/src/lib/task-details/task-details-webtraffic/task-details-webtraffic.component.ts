import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'app-task-details-webtraffic',
  templateUrl: './task-details-webtraffic.component.html',
  styleUrls: ['./task-details-webtraffic.component.css'],
})
export class TaskDetailsWebtrafficComponent {
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

  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}
}
