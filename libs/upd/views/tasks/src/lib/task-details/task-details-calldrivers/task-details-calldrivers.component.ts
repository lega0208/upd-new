import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'app-task-details-calldrivers',
  templateUrl: './task-details-calldrivers.component.html',
  styleUrls: ['./task-details-calldrivers.component.css'],
})
export class TaskDetailsCalldriversComponent {

  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}
}
