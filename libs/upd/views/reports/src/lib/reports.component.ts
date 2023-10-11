import { Component } from '@angular/core';

import { ReportsFacade } from './+state/reports.facade';
import { I18nFacade } from '@dua-upd/upd/state';

@Component({
  selector: 'upd-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent {
  tasksReports$ = this.reportsService.tasksReports$;
  tasksReportsColumns$ = this.reportsService.tasksReportsColumns$;

  projectsReports$ = this.reportsService.projectsReports$;
  projectsReportsColumns$ = this.reportsService.projectsReportsColumns$;

  error$ = this.reportsService.error$;

  constructor(
    private readonly reportsService: ReportsFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    this.reportsService.init();
  }
}
