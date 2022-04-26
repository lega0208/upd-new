import { MultiSeries } from '@amonsour/ngx-charts';
import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-task-details-calldrivers',
  templateUrl: './task-details-calldrivers.component.html',
  styleUrls: ['./task-details-calldrivers.component.css'],
})
export class TaskDetailsCalldriversComponent {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  // bar: MultiSeries = [
  //   {
  //     name: 'Feb 27-Mar 05',
  //     series: [
  //       { name: 'Benefits', value: 27704 },
  //       { name: 'e-Services Help Desk', value: 275665 },
  //       { name: 'ITE', value: 5887 },
  //       { name: 'C4 - Identity Theft', value: 1208 },
  //       { name: 'BE', value: 87427 },
  //     ],
  //   },
  //   {
  //     name: 'Mar 06-Mar 12',
  //     series: [
  //       { name: 'Benefits', value: 24704 },
  //       { name: 'e-Services Help Desk', value: 277665 },
  //       { name: 'ITE', value: 6255 },
  //       { name: 'C4 - Identity Theft', value: 201 },
  //       { name: 'BE', value: 81427 },
  //     ],
  //   },
  // ];
  charts = [
    {
      Topic: 'Electronic Services',
      'Number of calls for Feb 27-Mar 05': '72,740',
      'Number of calls for Mar 06-Mar 12': '68,306',
    },
    {
      Topic: 'COVID-19',
      'Number of calls for Feb 27-Mar 05': '43,549',
      'Number of calls for Mar 06-Mar 12': '52,792',
    },
    {
      Topic: 'Account Maintenance',
      'Number of calls for Feb 27-Mar 05': '38,342',
      'Number of calls for Mar 06-Mar 12': '41,206',
    },
    {
      Topic: 'Print requests',
      'Number of calls for Feb 27-Mar 05': '27,230',
      'Number of calls for Mar 06-Mar 12': '26,128',
    },
    {
      Topic: 'Payments to the CRA',
      'Number of calls for Feb 27-Mar 05': '20,663',
      'Number of calls for Mar 06-Mar 12': '22,806',
    },
  ];
  // chartsCols: ColumnConfig[] = [
  //   { field: 'Topic', header: 'Topic' },
  //   {
  //     field: 'Number of calls for Feb 27-Mar 05',
  //     header: 'Number of calls for Feb 27-Mar 05',
  //   },
  //   {
  //     field: 'Number of calls for Mar 06-Mar 12',
  //     header: 'Number of calls for Mar 06-Mar 12',
  //   },
  // ];

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}

  bar: MultiSeries = [];
  chartsCols: ColumnConfig[] = [];
  calldriversChart$ = this.taskDetailsService.calldriversChart$;
  calldriversTable$ = this.taskDetailsService.calldriversTable$;
  calldriversCols: ColumnConfig[] = [];


  dateRangeLabel$ = this.taskDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.taskDetailsService.comparisonDateRangeLabel$;

  ngOnInit() {
    this.i18n.service.onLangChange(
      ({ lang }) => { this.currentLang = lang as LocaleId; }
    );

    combineLatest([this.currentLang$, this.dateRangeLabel$, this.comparisonDateRangeLabel$]).subscribe(([lang, dateRange, comparisonDateRange]) => {
      this.bar = [
        {
          name: 'Feb 27-Mar 05',
          series: [
            { name: this.i18n.service.translate('d3-benefits', lang), value: 27777 },
            { name: this.i18n.service.translate('d3-e-Services', lang), value: 275665 },
            { name: this.i18n.service.translate('d3-ITE', lang), value: 5887 },
            { name: this.i18n.service.translate('d3-c4', lang), value: 1208 },
            { name: this.i18n.service.translate('d3-be', lang), value: 87427 }
          ],
        },
        {
          name: 'Mar 06-Mar 12',
          series: [
            { name: this.i18n.service.translate('d3-benefits', lang), value: 27778 },
            { name: this.i18n.service.translate('d3-e-Services', lang), value: 289665 },
            { name: this.i18n.service.translate('d3-ITE', lang), value: 8757 },
            { name: this.i18n.service.translate('d3-c4', lang), value: 3208 },
            { name: this.i18n.service.translate('d3-be', lang), value: 65027 }
          ],
        },
      ];
      this.chartsCols = [
        { field: 'Topic', header: this.i18n.service.translate('topic', lang) },
        {
          field: this.i18n.service.translate('Number of calls for', lang, {value: ' Feb 27-Mar 05'}),
          header: this.i18n.service.translate('Number of calls for', lang, {value: ' Feb 27-Mar 05'})
        },
        {
          field: this.i18n.service.translate('Number of calls for', lang, {value: ' Mar 06-Mar 12'}),
          header: this.i18n.service.translate('Number of calls for', lang, {value: ' Mar 06-Mar 12'})
        },
      ];
      this.calldriversCols = [
        { field: 'name', header: this.i18n.service.translate('Inquiry line', lang) },
        {
          field: 'currValue',
          header: dateRange,
          pipe: 'number',
        },
        {
          field: 'prevValue',
          header: comparisonDateRange,
          pipe: 'number',
        },
      ];
    });
  }
}
