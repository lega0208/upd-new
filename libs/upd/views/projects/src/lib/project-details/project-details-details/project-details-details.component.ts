import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-details',
  templateUrl: './project-details-details.component.html',
  styleUrls: ['./project-details-details.component.css'],
})
export class ProjectDetailsDetailsComponent {

  memberList$ = this.projectsDetailsService.taskSuccessByUxTest$;
  memberListCols = [
    {
      field: 'role',
      header: 'Role',
    },
    {
      field: 'projectLead',
      header: 'Name',
    },
    {
      field: 'vendor',
      header: 'Product',
    }
  ] as ColumnConfig[];
  
  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade) {}
}
