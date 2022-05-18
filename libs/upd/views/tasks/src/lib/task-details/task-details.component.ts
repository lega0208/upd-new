import { Component, OnInit } from '@angular/core';
import { TasksDetailsFacade } from './+state/tasks-details.facade';

import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';

@Component({
  selector: 'upd-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
})
export class TaskDetailsComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  title$ = this.taskDetailsService.titleHeader$;
  error$ = this.taskDetailsService.error$;
  loading$ = this.taskDetailsService.loading$;

  currentRoute$ = this.taskDetailsService.currentRoute$;

  navTabs: { href: string; title: string }[] = [];

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    this.taskDetailsService.init();

    this.currentLang$.subscribe((lang) => {
      this.navTabs = [
        {
          href: 'summary',
          title: this.i18n.service.translate('tab-summary', lang),
        },
        {
          href: 'webtraffic',
          title: this.i18n.service.translate('tab-webtraffic', lang),
        },
        {
          href: 'searchanalytics',
          title: this.i18n.service.translate('tab-searchanalytics', lang),
        },
        {
          href: 'pagefeedback',
          title: this.i18n.service.translate('tab-pagefeedback', lang),
        },
        {
          href: 'calldrivers',
          title: this.i18n.service.translate('tab-calldrivers', lang),
        },
        {
          href: 'uxtests',
          title: this.i18n.service.translate('tab-uxtests', lang),
        },
      ];

      this.langLink = lang === EN_CA ? 'en' : 'fr';
    });
  }
}
