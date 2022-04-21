import { Component, OnInit } from '@angular/core';
import { ColumnConfig, ColumnConfigPipe } from '@cra-arc/upd-components';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-task-details-ux-tests',
  templateUrl: './task-details-ux-tests.component.html',
  styleUrls: ['./task-details-ux-tests.component.css'],
})
export class TaskDetailsUxTestsComponent {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  taskSuccessChart$ = this.taskDetailsService.taskSuccessChart$;
  // taskSuccessChartCols = [
  //   { field: 'name', header: 'Title' },
  //   { field: 'value', header: 'Success Rate', pipe: 'percent' },
  // ] as ColumnConfig[];
  taskSuccessData$ = this.taskDetailsService.taskSuccessByUxTest$;

  totalParticipants$ = this.taskDetailsService.totalParticipants$;

  avgTaskSuccessFromLastTest$ =
    this.taskDetailsService.avgTaskSuccessFromLastTest$;

  // taskSuccessDataCols = [
  //   { field: 'title', header: 'Title' },
  //   { field: 'scenario', header: 'Scenario' },
  //   { field: 'result', header: 'Result' },
  //   { field: 'successRate', header: 'Result', pipe: 'percent' },
  //   {
  //     field: 'date',
  //     header: 'Date',
  //     pipe: 'date',
  //     pipeParam: 'MMM d, y' as ColumnConfigPipe,
  //   },
  // ] as ColumnConfig[];

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}

  taskSuccessChartCols: ColumnConfig[] = [];
  taskSuccessDataCols: ColumnConfig[] = [];

  ngOnInit() {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([
      this.currentLang$
    ]).subscribe(([lang]) => {
      this.taskSuccessChartCols = [
        { field: 'name', header: this.i18n.service.translate('Title', lang) },
        { field: 'value', header: this.i18n.service.translate('success-rate', lang), pipe: 'percent' },
      ];
      this.taskSuccessDataCols = [
        { field: 'title', header: this.i18n.service.translate('Title', lang) },
        { field: 'scenario', header: this.i18n.service.translate('Scenario', lang) },
        { field: 'result', header: this.i18n.service.translate('Result', lang) },
        { field: 'successRate', header: this.i18n.service.translate('success-rate', lang), pipe: 'percent' },
        { field: 'date', header: this.i18n.service.translate('Date', lang), pipe: 'date', pipeParam: 'MMM d, y' as ColumnConfigPipe },
      ];
    });
  }
}
