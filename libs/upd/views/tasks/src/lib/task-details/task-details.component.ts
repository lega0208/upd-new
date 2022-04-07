import { Component, OnInit } from '@angular/core';
import { TasksDetailsFacade } from './+state/tasks-details.facade';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
})
export class TaskDetailsComponent implements OnInit {
  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}

  ngOnInit() {
    this.taskDetailsService.init();
  }
}
