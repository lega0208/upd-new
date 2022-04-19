import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-search-analytics',
  templateUrl: './project-details-search-analytics.component.html',
  styleUrls: ['./project-details-search-analytics.component.css'],
})
export class ProjectDetailsSearchAnalyticsComponent  {
  gscTotalClicks$ = this.projectsDetailsService.gscTotalClicks$;

  gscTotalImpressions$ = this.projectsDetailsService.gscTotalImpressions$;
  gscTotalCtr$ = this.projectsDetailsService.gscTotalCtr$;
  gscTotalPosition$ = this.projectsDetailsService.gscTotalPosition$;

  visitsByPage$ = this.projectsDetailsService.visitsByPage$;
  visitsByPageCols = [
    {
      field: 'url',
      header: 'Url',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id' },
    },
    {
      field: 'gscTotalClicks',
      header: 'Clicks',
      pipe: 'number',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id', postLink: 'searchanalytics' },
    },
    {
      field: 'gscTotalImpressions',
      header: 'Impressions',
      pipe: 'number',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id', postLink: 'searchanalytics' },
    },
    {
      field: 'gscTotalCtr',
      header: 'CTR (Click Through Rate)',
      pipe: 'percent',
    },
    {
      field: 'gscTotalPosition',
      header: 'Position',
      pipe: 'number',
    },
    { field: '0', header: 'Comparison (for Clicks)', pipe: 'percent' },
  ] as ColumnConfig[];
  
  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade) {}
}
