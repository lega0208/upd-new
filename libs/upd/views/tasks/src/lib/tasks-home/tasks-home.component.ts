import { Component, OnInit } from '@angular/core';
import { combineLatest, observable } from 'rxjs';

import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { TasksHomeAggregatedData } from '@dua-upd/types-common';
import { TasksHomeFacade } from './+state/tasks-home.facade';

@Component({
  selector: 'upd-tasks-home',
  templateUrl: './tasks-home.component.html',
  styleUrls: ['./tasks-home.component.css'],
})
export class TasksHomeComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  totalTasks$ = this.tasksHomeService.totalTasks$;
  tasksHomeData$ = this.tasksHomeService.tasksHomeTableData$;

  columns: ColumnConfig<TasksHomeAggregatedData>[] = [];
  searchFields = this.columns.map((col) => col.field);

  constructor(
    private readonly tasksHomeService: TasksHomeFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    this.tasksHomeService.init();

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.columns = [
        {
          field: 'title',
          header: this.i18n.service.translate('task', lang),
          type: 'link',
          typeParam: '_id',
          filterConfig: {
            type: 'text',
          },
        },
        {
          field: 'topic',
          header: this.i18n.service.translate('category', lang),
          filterConfig: {
            type: 'category',
            categories: [
              {
                name: this.i18n.service.translate('Taxes', lang),
                value: 'Taxes',
              },
              {
                name: this.i18n.service.translate('Benefits', lang),
                value: 'Benefits',
              },
              {
                name: this.i18n.service.translate('Business', lang),
                value: 'Business',
              },
              {
                name: this.i18n.service.translate('Business Number', lang),
                value: 'Business Number',
              },
              {
                name: this.i18n.service.translate('Other', lang),
                value: 'Other',
              },
            ],
          },
        },
        {
          field: 'subtopic',
          header: this.i18n.service.translate('sub-category', lang),
          filterConfig: {
            type: 'category',
            categories: [
              {
                name: this.i18n.service.translate('Payroll', lang),
                value: 'Payroll',
              },
              {
                name: this.i18n.service.translate('GST/HST', lang),
                value: 'GST/HST',
              },
              {
                name: this.i18n.service.translate('Common', lang),
                value: 'Common',
              },
              {
                name: this.i18n.service.translate('COVID-19 Benefits', lang),
                value: 'COVID-19 Benefits',
              },
              {
                name: this.i18n.service.translate('Income Tax', lang),
                value: 'Income Tax',
              },
              {
                name: this.i18n.service.translate(
                  'Savings and Pension Plans',
                  lang
                ),
                value: 'Savings and Pension Plans',
              },
              {
                name: this.i18n.service.translate(
                  'Managing your business during COVID-19',
                  lang
                ),
                value: 'Managing your business during COVID-19',
              },
            ],
          },
        },
        {
          field: 'visits',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
      ];
    });
  }
}
