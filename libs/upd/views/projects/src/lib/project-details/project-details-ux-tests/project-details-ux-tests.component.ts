import { Component, OnInit } from '@angular/core';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-ux-tests',
  templateUrl: './project-details-ux-tests.component.html',
  styleUrls: ['./project-details-ux-tests.component.css'],
})
export class ProjectDetailsUxTestsComponent {

  data$ = this.projectsDetailsService.projectsDetailsData$;
  
  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade) {}
}
