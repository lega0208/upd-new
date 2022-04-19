import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-summary',
  templateUrl: './project-details-summary.component.html',
  styleUrls: ['./project-details-summary.component.css'],
})
export class ProjectDetailsSummaryComponent {
  avgTaskSuccessFromLastTest$ =
    this.projectsDetailsService.avgTaskSuccessFromLastTest$;

  visits$ = this.projectsDetailsService.visits$;

  participantTasks$ = this.projectsDetailsService.taskSuccessByUxTestDefault$;
  participantTasksCols = [
    {
      field: 'title',
      header: 'Task list',
      type: 'link',
      typeParams: { preLink: '/tasks', link: 'tasks' },
    }
  ] as ColumnConfig[];

  dyfChart$ = this.projectsDetailsService.dyfData$;
  whatWasWrongChart$ = this.projectsDetailsService.whatWasWrongData$;

  dyfTableCols: ColumnConfig[] = [
    { field: 'name', header: 'Selection' },
    { field: 'value', header: 'Visits', pipe: 'number' },
  ];
  whatWasWrongTableCols: ColumnConfig[] = [
    { field: 'name', header: 'What was wrong' },
    { field: 'value', header: 'Visits', pipe: 'number' },
  ];

  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade) {}
}
