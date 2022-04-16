import { Component, OnInit } from '@angular/core';
import { TasksDetailsFacade } from './+state/tasks-details.facade';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
})
export class TaskDetailsComponent implements OnInit {
  title$ = this.taskDetailsService.title$;
  loading$ = this.taskDetailsService.loading$;
  

  navTabs: { href: string; title: string }[] = [
    { href: 'summary', title: 'Summary' },
    { href: 'webtraffic', title: 'Web Traffic' },
    { href: 'searchanalytics', title: 'Search Analytics' },
    { href: 'pagefeedback', title: 'Page Feedback' },
    { href: 'calldrivers', title: 'Call Drivers' },
    { href: 'uxtests', title: 'UX Tests' },
  ];

  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}

  ngOnInit() {
    this.taskDetailsService.init();
  }
}
