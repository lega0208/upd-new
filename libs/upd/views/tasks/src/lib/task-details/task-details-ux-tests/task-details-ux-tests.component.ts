import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { GetTableProps } from '@dua-upd/utils-common';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

type DocumentsColTypes = GetTableProps<
  TaskDetailsUxTestsComponent,
  'documents$'
>;

@Component({
  selector: 'upd-task-details-ux-tests',
  templateUrl: './task-details-ux-tests.component.html',
  styleUrls: ['./task-details-ux-tests.component.css'],
})
export class TaskDetailsUxTestsComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  taskSuccessChart$ = this.taskDetailsService.taskSuccessChart$;
  taskSuccessChartData$ = this.taskDetailsService.taskSuccessChartData$;
  taskSuccessChartLegend$ = this.taskDetailsService.taskSuccessChartLegend$;
  taskSuccessData$ = this.taskDetailsService.taskSuccessByUxTest$;

  totalParticipants$ = this.taskDetailsService.totalParticipants$;
  taskSuccessByUxTest$ = this.taskDetailsService.taskSuccessByUxTest$;
  dateFromLastTest$ = this.taskDetailsService.dateFromLastTest$;

  avgTaskSuccessFromLastTest$ =
    this.taskDetailsService.avgTaskSuccessFromLastTest$;
  avgSuccessPercentChange$ = this.taskDetailsService.avgSuccessPercentChange$;

  documents$ = this.taskDetailsService.documents$;
  documentsCols: ColumnConfig<DocumentsColTypes>[] = [];

  taskSuccessChartCols: ColumnConfig[] = [];
  taskSuccessDataCols: ColumnConfig[] = [];

  avgTaskSuccessKpiCriteria = (successRate: number) =>
    successRate >= 0.8 ? 'pass' : 'fail';

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.documentsCols = [
        {
          field: 'filename',
          header: this.i18n.service.translate('Documents', lang),
          type: 'link',
          typeParams: { link: 'url', external: true },
        },
      ];
      this.taskSuccessChartCols = [
        { field: 'name', header: this.i18n.service.translate('Title', lang) },
        {
          field: 'value',
          header: this.i18n.service.translate('success-rate', lang),
          pipe: 'percent',
        },
      ];
      this.taskSuccessDataCols = [
        { field: 'title', header: this.i18n.service.translate('Title', lang) },
        {
          field: 'scenario',
          header: this.i18n.service.translate('Scenario', lang),
        },
        // { field: 'result', header: this.i18n.service.translate('Result', lang) },
        {
          field: 'success_rate',
          header: this.i18n.service.translate('success-rate', lang),
          pipe: 'percent',
        },
        {
          field: 'date',
          header: this.i18n.service.translate('Date', lang),
          pipe: 'date',
        },
      ];
    });
  }
}
