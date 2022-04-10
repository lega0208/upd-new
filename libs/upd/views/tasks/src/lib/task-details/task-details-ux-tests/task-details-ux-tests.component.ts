import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'app-task-details-ux-tests',
  templateUrl: './task-details-ux-tests.component.html',
  styleUrls: ['./task-details-ux-tests.component.css'],
})
export class TaskDetailsUxTestsComponent {
  uxTests$ = [
    {
      name: 'SPR Baseline 3',
      value: 0.88,
    },
  ];

  successRate$ = [
    {
      title: 'SPR Baseline 3',
      scenario: 'Lorem ipsum',
      result: '88%',
      date: 2021 - 10 - 27,
      participants: 8,
    },
  ];

  successRateCols = [
    { field: 'title', header: 'Title' },
    { field: 'scenario', header: 'Scenario' },
    { field: 'result', header: 'Result' },
    { field: 'date', header: 'Date', pipe: 'date' },
  ];

  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}
}
