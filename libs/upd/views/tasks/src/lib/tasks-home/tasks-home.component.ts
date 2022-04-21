import { Component, OnInit } from '@angular/core';
import { TasksHomeFacade } from './+state/tasks-home.facade';
import { ColumnConfig } from '@cra-arc/upd-components';

import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-tasks-home',
  templateUrl: './tasks-home.component.html',
  styleUrls: ['./tasks-home.component.css'],
})
export class TasksHomeComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  tasksHomeData$ = this.tasksHomeService.tasksHomeTableData$;
  data$ = this.tasksHomeService.tasksHomeData$

  // columns: ColumnConfig[] = [
  //   {
  //     field: 'title',
  //     header: 'Task',
  //     type: 'link',
  //     typeParam: '_id',
  //     tooltip: 'tooltip',
  //   },
  //   {
  //     field: 'topic',
  //     header: 'Category',
  //     tooltip: 'tooltip',
  //   },
  //   {
  //     field: 'subtopic',
  //     header: 'Sub-category',
  //     tooltip: 'tooltip',
  //   },
  //   {
  //     field: 'visits',
  //     header: 'Visits',
  //     tooltip: 'tooltip',
  //     pipe: 'number',
  //   }
  // ];

  columns: ColumnConfig[] = [];
  searchFields = this.columns.map((col) => col.field);

  constructor(private readonly tasksHomeService: TasksHomeFacade, private i18n: I18nFacade) {}

  ngOnInit() {

    this.tasksHomeService.init();

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.columns = [
        {
          field: 'title',
          header: this.i18n.service.translate('task', lang),
          type: 'link',
          typeParam: '_id',
        },
        {
          field: 'topic',
          header: this.i18n.service.translate('category', lang),
        },
        {
          field: 'subtopic',
          header: this.i18n.service.translate('sub-category', lang),
        },
        {
          field: 'visits',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        }
      ];
    });
  }
}
