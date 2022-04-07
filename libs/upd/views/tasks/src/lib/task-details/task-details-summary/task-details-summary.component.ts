import { Component, OnInit } from '@angular/core';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'app-task-details-summary',
  templateUrl: './task-details-summary.component.html',
  styleUrls: ['./task-details-summary.component.css'],
})
export class TaskDetailsSummaryComponent {
  data$ = this.taskDetailsService.tasksDetailsData$;

  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}
}
