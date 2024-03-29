import { Component, inject, OnInit } from '@angular/core';
import { map } from 'rxjs';
import type { ColumnConfig } from '@dua-upd/types-common';
import type { UnwrapObservable } from '@dua-upd/utils-common';
import { TasksHomeFacade } from './+state/tasks-home.facade';

@Component({
  selector: 'upd-tasks-home',
  templateUrl: './tasks-home.component.html',
  styleUrls: ['./tasks-home.component.css'],
})
export class TasksHomeComponent implements OnInit {
  private readonly tasksHomeService = inject(TasksHomeFacade);

  loading$ = this.tasksHomeService.loaded$.pipe(map((loaded) => !loaded));

  totalTasks$ = this.tasksHomeService.totalTasks$;
  tasksHomeData$ = this.tasksHomeService.tasksHomeTableData$;
  totalVisits$ = this.tasksHomeService.totalVisits$;
  totalVisitsChange$ = this.tasksHomeService.totalVisitsChange$;
  totalCalls$ = this.tasksHomeService.totalCalls$;
  totalCallsChange$ = this.tasksHomeService.totalCallsChange$;

  tasksHomeColumns = [
    {
      field: 'group',
      header: 'group',
      hide: true,
      translate: true,
    },
    {
      field: 'tasks_subgroup',
      header: 'tasks_subgroup',
      hide: true,
      translate: true,
    },
    {
      field: 'service',
      header: 'service',
      hide: true,
      translate: true,
    },
    {
      field: 'user_journey',
      header: 'user_journey',
      hide: true,
      translate: true,
    },
    {
      field: 'status',
      header: 'status',
      hide: true,
      translate: true,
    },
    {
      field: 'channel',
      header: 'channel',
      hide: true,
      translate: true,
    },
    {
      field: 'core',
      header: 'core',
      hide: true,
      translate: true,
    },
    // {
    //   field: 'tmf_rank',
    //   header: 'TMF Rank',
    //   pipe: 'number',
    // },
    {
      field: 'task',
      header: 'task',
      type: 'link',
      typeParam: '_id',
      translate: true,
    },
    // {
    //   field: 'top_task',
    //   header:'Top task',
    // },
    // {
    //   field: 'status',
    //   header: 'Status',
    //   translate: true,
    // },
    // {
    //   field: 'secure_portal',
    //   header: 'Secure portal',
    // },
    // {
    //   field: 'portfolio',
    //   header: 'Portfolio',
    //   translate: true,
    // },
    // {
    //   field: 'ux_testing',
    //   header: 'UX testing',
    // },
    // {
    //   field: 'cops',
    //   header: 'COPS',
    //   type: 'label',
    //   typeParam: '??' // copy from projects
    // },
    // {
    //   field: 'pages_mapped',
    //   header: 'Pages mapped',
    //   pipe: 'number',
    // },
    // {
    //   field: 'projects_mapped',
    //   header: 'Projects mapped',
    //   pipe: 'number',
    // },
    // { // todo: add when available
    //   field: 'gc_survey_participants',
    //   header: 'Survey'
    // },
    {
      field: 'program',
      header: 'Program',
      translate: true,
    },
    {
      field: 'user_type',
      header: 'Audience',
      translate: true,
    },
    {
      field: 'topic',
      header: 'topic',
      translate: true,
    },
    {
      field: 'tasks_subtopic',
      header: 'tasks_subtopic',
      translate: true,
      hide: true,
    },
    {
      field: 'visits',
      header: 'visits',
      pipe: 'number',
    },
    {
      field: 'calls',
      header: 'calls',
      pipe: 'number',
    },
    {
      field: 'calls_per_100_visits',
      header: 'kpi-calls-per-100-title',
      pipe: 'number',
      pipeParam: '1.3-3',
    },
  ] as ColumnConfig<UnwrapObservable<typeof this.tasksHomeData$>>[];

  ngOnInit() {
    this.tasksHomeService.init();
  }
}
