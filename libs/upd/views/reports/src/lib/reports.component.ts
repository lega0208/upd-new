import { Component } from '@angular/core';

import { ReportsFacade } from './+state/reports.facade';
import { I18nFacade } from '@dua-upd/upd/state';
import { ReportsData } from '@dua-upd/types-common';
import { ColumnConfig } from '@dua-upd/upd-components';

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

  columns: ColumnConfig<ReportsData>[] = [];
  searchFields = this.columns.map((col) => col.field);

  constructor(
    private readonly reportsService: ReportsFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    this.reportsService.init();
  }
}
