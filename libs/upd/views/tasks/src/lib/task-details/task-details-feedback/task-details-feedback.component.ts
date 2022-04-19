import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'app-task-details-feedback',
  templateUrl: './task-details-feedback.component.html',
  styleUrls: ['./task-details-feedback.component.css'],
})
export class TaskDetailsFeedbackComponent {
  visitsByPage$ = this.taskDetailsService.visitsByPage$;
  visitsByPageCols = [
    {
      field: 'url',
      header: 'Url',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id' },
    },
    {
      field: 'dyfYes',
      header: 'Yes',
      pipe: 'number',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id', postLink: 'pagefeedback' },
    },
    {
      field: 'dyfNo',
      header: 'No',
      pipe: 'number',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id', postLink: 'pagefeedback' },
    },
    { field: '0', header: 'Comparison (for No answer)', pipe: 'percent' },
    { field: '0', header: '% of visitors who left feedback', pipe: 'percent' },
  ] as ColumnConfig[];

  dyfChart$ = this.taskDetailsService.dyfData$;
  whatWasWrongChart$ = this.taskDetailsService.whatWasWrongData$;

  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}
}
