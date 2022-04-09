import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-details',
  templateUrl: './project-details-details.component.html',
  styleUrls: ['./project-details-details.component.css'],
})
export class ProjectDetailsDetailsComponent {

  memberList$ = this.projectsDetailsService.memberList$;
  memberListCols = [
    {
      field: 'role',
      header: 'Role',
    },
    {
      field: 'project_lead',
      header: 'Name',
    },
    {
      field: 'product',
      header: 'Product',
    }
  ] as ColumnConfig[];
  
  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade) {}
}
