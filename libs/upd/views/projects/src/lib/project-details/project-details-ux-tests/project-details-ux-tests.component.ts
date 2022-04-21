import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-ux-tests',
  templateUrl: './project-details-ux-tests.component.html',
  styleUrls: ['./project-details-ux-tests.component.css'],
})
export class ProjectDetailsUxTestsComponent {
  bubbleChart$ = this.projectsDetailsService.bubbleChart$;

  avgTaskSuccessFromLastTest$ =
    this.projectsDetailsService.avgTaskSuccessFromLastTest$;
  dateFromLastTest$ = this.projectsDetailsService.dateFromLastTest$;
  taskSuccessByUxTest$ = this.projectsDetailsService.taskSuccessByUxTest$;
  totalParticipants$ = this.projectsDetailsService.totalParticipants$;

  participantTasks$ = this.projectsDetailsService.taskSuccessByUxTestDefault$;
  participantTasksCols = [
    {
      field: 'title',
      header: 'Task list',
      type: 'link',
      typeParams: { preLink: '/tasks', link: 'tasks' },
    },
  ] as ColumnConfig[];

  taskSuccessRateCols = [
    {
      field: 'title',
      header: 'Task',
    },
    {
      field: 'testType',
      header: 'Test type',
    },
    {
      field: 'successRate',
      header: 'Success rate',
      pipe: 'percent',
    },
  ] as ColumnConfig[];

  uxTests$ = [
    {
      name: 'SPR Baseline 3',
      value: 0.88,
    },
  ];

  successRate$ = [
    {
      title: 'SPR Baseline 3',
      scenario: 'Lorem ipsum',
      result: 0.88,
      date: 2021 - 10 - 27,
      participants: 8,
    },
  ];

  successRateCols = [
    { field: 'title', header: 'Task' },
    { field: 'result', header: 'Baseline', pipe: 'percent' },
  ] as ColumnConfig[];

  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade) {}
}
