import { Component, OnInit } from '@angular/core';
import { TasksHomeFacade } from './+state/tasks-home.facade';
import { ColumnConfig } from '@cra-arc/upd-components';

@Component({
  selector: 'app-tasks-home',
  templateUrl: './tasks-home.component.html',
  styleUrls: ['./tasks-home.component.css'],
})
export class TasksHomeComponent implements OnInit {
  tasksHomeData$ = this.tasksHomeService.tasksHomeTableData$;
  data$ = this.tasksHomeService.tasksHomeData$

  columns: ColumnConfig[] = [
    {
      field: 'title',
      header: 'Task',
      type: 'link',
      typeParam: '_id',
      tooltip: 'tooltip',
    },
    {
      field: 'topic',
      header: 'Category',
      tooltip: 'tooltip',
    },
    {
      field: 'subtopic',
      header: 'Sub-category',
      tooltip: 'tooltip',
    },
    {
      field: 'visits',
      header: 'Visits',
      tooltip: 'tooltip',
      pipe: 'number',
    }
  ];

  searchFields = this.columns.map((col) => col.field);

  constructor(private readonly tasksHomeService: TasksHomeFacade) {}

  ngOnInit() {
    this.tasksHomeService.init();
  }
}
