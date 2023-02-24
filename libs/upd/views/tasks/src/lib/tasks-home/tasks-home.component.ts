import { Component, OnInit } from '@angular/core';
import { combineLatest, map } from 'rxjs';

import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { TasksHomeAggregatedData } from '@dua-upd/types-common';
import { TasksHomeFacade } from './+state/tasks-home.facade';
import { createCategoryConfig } from '@dua-upd/upd/utils';

@Component({
  selector: 'upd-tasks-home',
  templateUrl: './tasks-home.component.html',
  styleUrls: ['./tasks-home.component.css'],
})
export class TasksHomeComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;
  loading$ = this.tasksHomeService.loaded$.pipe(map((loaded) => !loaded));

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

    //     _id(pin):"621d280492982ac8c344d19b"
    // airtable_id(pin):"rec0lmQEXjRMbrLQJ"
    // title(pin):"Access my Tax Information"
    // group(pin):"Check Status"
    // subgroup(pin):""
    // topic(pin):"Taxes"
    // subtopic(pin):""
    // program(pin):""
    // service(pin):"E-services (online portals, etc.)"
    // user_journey(pin):
    // status(pin):""

    combineLatest([this.tasksHomeData$, this.currentLang$]).subscribe(
      ([data, lang]) => {
        this.columns = [
          {
            field: 'group',
            header: this.i18n.service.translate('group', lang),
            displayFilterOptions: true,
            displayTable: false,
          },
          {
            field: 'subgroup',
            header: this.i18n.service.translate('subgroup', lang),
            displayFilterOptions: true,
            displayTable: false,
          },
          {
            field: 'service',
            header: this.i18n.service.translate('service', lang),
            displayFilterOptions: true,
            displayTable: false,
          },
          {
            field: 'user_journey',
            header: this.i18n.service.translate('user_journey', lang),
            displayFilterOptions: true,
            displayTable: false,
          },
          {
            field: 'status',
            header: this.i18n.service.translate('status', lang),
            displayFilterOptions: true,
            displayTable: false,
          },
          {
            field: 'channel',
            header: this.i18n.service.translate('channel', lang),
            displayFilterOptions: true,
            displayTable: false,
          },
          {
            field: 'core',
            header: this.i18n.service.translate('core', lang),
            displayFilterOptions: true,
            displayTable: false,
          },
          {
            field: 'title',
            header: this.i18n.service.translate('task', lang),
            type: 'link',
            typeParam: '_id',
            translate: true,
            displayTable: true,
          },
          {
            field: 'program',
            header: this.i18n.service.translate('Program', lang),
            // filterConfig: {
            //   type: 'category',
            //   categories: createCategoryConfig({
            //     i18n: this.i18n.service,
            //     data,
            //     field: 'program',
            //   }),
            // },
            translate: true,
            displayFilterOptions: true,
            displayTable: true,
          },
          {
            field: 'user_type',
            header: this.i18n.service.translate('Audience', lang),
            //   filterConfig: {
            //     type: 'category',
            //     categories: createCategoryConfig({
            //       i18n: this.i18n.service,
            //       data,
            //       field: 'user_type',
            //     }),
            //   },
            translate: true,
            displayFilterOptions: true,
            displayTable: true,
          },
          {
            field: 'topic',
            header: this.i18n.service.translate('topic', lang),
            // filterConfig: {
            //   type: 'category',
            //   categories: createCategoryConfig({
            //     i18n: this.i18n.service,
            //     data,
            //     field: 'topic',
            //   }),
            // },
            translate: true,
            displayFilterOptions: true,
            displayTable: true,
          },
          {
            field: 'subtopic',
            header: this.i18n.service.translate('sub-topic', lang),
            // filterConfig: {
            //   type: 'category',
            //   categories: createCategoryConfig({
            //     i18n: this.i18n.service,
            //     data,
            //     field: 'subtopic',
            //   }),
            // },
            translate: true,
            displayFilterOptions: true,
            displayTable: true,
          },

          {
            field: 'sub_subtopic',
            header: this.i18n.service.translate('sub-subtopic', lang),
            translate: true,
            displayFilterOptions: true,
            displayTable: false,
          },
          {
            field: 'visits',
            header: this.i18n.service.translate('visits', lang),
            pipe: 'number',
          },
        ];
      }
    );
  }
}
