import { Component, OnInit } from '@angular/core';
import { TasksDetailsFacade } from './+state/tasks-details.facade';

import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
})
export class TaskDetailsComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  title$ = this.taskDetailsService.title$;
  error$ = this.taskDetailsService.error$;
  loading$ = this.taskDetailsService.loading$;

  // navTabs: { href: string; title: string }[] = [
  //   { href: 'summary', title: 'Summary' },
  //   { href: 'webtraffic', title: 'Web Traffic' },
  //   { href: 'searchanalytics', title: 'Search Analytics' },
  //   { href: 'pagefeedback', title: 'Page Feedback' },
  //   { href: 'calldrivers', title: 'Call Drivers' },
  //   { href: 'uxtests', title: 'UX Tests' },
  // ];

  navTabs: { href: string; title: string }[] = [];

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    this.taskDetailsService.init();
    
    combineLatest([
      this.currentLang$
    ]).subscribe(([lang]) => {
      this.navTabs = [
        { href: 'summary', title: this.i18n.service.translate('tab-summary', lang) },
        { href: 'webtraffic', title: this.i18n.service.translate('tab-webtraffic', lang) },
        { href: 'searchanalytics', title: this.i18n.service.translate('tab-searchanalytics', lang) },
        { href: 'pagefeedback', title: this.i18n.service.translate('tab-pagefeedback', lang) },
        { href: 'calldrivers', title: this.i18n.service.translate('tab-calldrivers', lang) },
        { href: 'uxtests', title: this.i18n.service.translate('tab-uxtests', lang) },
      ];
    });
  }
}
