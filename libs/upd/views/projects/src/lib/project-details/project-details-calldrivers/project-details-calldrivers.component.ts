import { Component, OnInit } from '@angular/core';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-calldrivers',
  templateUrl: './project-details-calldrivers.component.html',
  styleUrls: ['./project-details-calldrivers.component.css'],
})
export class ProjectDetailsCalldriversComponent {

  data$ = this.projectsDetailsService.projectsDetailsData$;
  
  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade) {}
}
