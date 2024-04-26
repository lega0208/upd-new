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
    {
      field: 'tmf_rank',
      header: 'Rank',
      pipe: 'number',
      frozen: true,
      width: '80px',
    },
    {
      field: 'task',
      header: 'task',
      type: 'link',
      typeParam: '_id',
      translate: true,
      frozen: true,
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
    {
      field: 'portfolio',
      header: 'Portfolio',
      hide: true,
      translate: true,
    },
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
    {
      field: 'program',
      header: 'Program',
      hide: true,
      translate: true,
    },
    {
      field: 'user_type',
      header: 'Audience',
      translate: true,
      frozen: true,
    },
    {
      field: 'topic',
      header: 'topic',
      hide: true,
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
      width: '100px',
    },
    {
      field: 'calls',
      header: 'calls',
      pipe: 'number',
      width: '100px',
    },
    {
      field: 'dyf_no',
      header: 'dyf_no',
      pipe: 'number',
      width: '140px',
      hide: true,
    },
    {
      field: 'survey',
      header: 'survey',
      pipe: 'number',
      tooltip: 'tooltip-survey-volume',
      width: '100px',
    },
    {
      field: 'calls_per_100_visits',
      header: 'kpi-calls-per-100-title',
      pipe: 'number',
      pipeParam: '1.2-2',
      width: '120px',
    },
    {
      field: 'calls_percent_change',
      header: 'kpi-calls-per-100-title-change',
      pipe: 'percent',
      pipeParam: '1.0-2',
      upGoodDownBad: false,
      indicator: true,
      secondaryField: {
        field: 'calls_per_100_visits_difference',
        pipe: 'number',
        pipeParam: '1.0-2',
      },
      width: '150px',
    },
    {
      field: 'dyf_no_per_1000_visits',
      header: 'kpi-feedback-per-1000-title',
      pipe: 'number',
      pipeParam: '1.2-2',
      width: '120px',
    },
    {
      field: 'dyf_no_percent_change',
      header: 'kpi-feedback-per-1000-title-change',
      pipe: 'percent',
      pipeParam: '1.0-2',
      upGoodDownBad: false,
      indicator: true,
      secondaryField: {
        field: 'dyf_no_per_1000_visits_difference',
        pipe: 'number',
        pipeParam: '1.0-2',
      },
      width: '150px',
    },
    {
      field: 'survey_completed',
      header: 'Self-reported success',
      pipe: 'percent',
      hide: true,
      tooltip: 'tooltip-self-reported-success',
    },
    {
      field: 'latest_ux_success',
      header: 'Latest success rate',
      pipe: 'percent',
      hide: true,
      tooltip: 'tooltip-latest-success-rate',
      width: '100px',
    },
    // latest_success_rate_difference,
    // latest_success_rate_percent_change,
    {
      field: 'latest_success_rate_percent_change',
      header: 'latest_success_rate_change',
      pipe: 'percent',
      pipeParam: '1.0-2',
      upGoodDownBad: true,
      indicator: true,
      secondaryField: {
        field: 'latest_success_rate_difference',
        pipe: 'number',
        pipeParam: '1.0-2',
      },
      hide: true,
      width: '140px',
    },
  ] as ColumnConfig<UnwrapObservable<typeof this.tasksHomeData$>>[];

  ngOnInit() {
    this.tasksHomeService.init();
  }
}
