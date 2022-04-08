import { Component, OnInit } from '@angular/core';
import { TasksDetailsFacade } from './+state/tasks-details.facade';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
})
export class TaskDetailsComponent implements OnInit {
  title$ = this.taskDetailsService.title$;

  navTabs: { href: string; title: string }[] = [
    { href: 'summary', title: 'Summary' },
    { href: 'webtraffic', title: 'Web Traffic' },
    { href: 'search_analytics', title: 'Search Analytics' },
    { href: 'feedback', title: 'Page Feedback' },
  ];

  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}

  ngOnInit() {
    this.taskDetailsService.init();
  }
}
