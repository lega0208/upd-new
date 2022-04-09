import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-webtraffic',
  templateUrl: './project-details-webtraffic.component.html',
  styleUrls: ['./project-details-webtraffic.component.css'],
})
export class ProjectDetailsWebtrafficComponent  {
  visits$ = this.projectsDetailsService.visits$;

  visitsByPage$ = this.projectsDetailsService.visitsByPage$;
  visitsByPageCols = [
    {
      field: 'title',
      header: 'Page title',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id' },
    },
    {
      field: 'url',
      header: 'Url',
      type: 'link',
      typeParams: { link: 'url', external: true },
    },
    { field: 'visits', header: 'Visits', pipe: 'number' },
    { field: 'change', header: '% Change', pipe: 'percent' },
  ] as ColumnConfig[];
  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade) {}
}
