import { Component } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'app-task-details-search-analytics',
  templateUrl: './task-details-search-analytics.component.html',
  styleUrls: ['./task-details-search-analytics.component.css'],
})
export class TaskDetailsSearchAnalyticsComponent {

  gscTotalClicks$ = this.taskDetailsService.gscTotalClicks$;

  gscTotalImpressions$ = this.taskDetailsService.gscTotalImpressions$;
  gscTotalImpressionsPercentChange$ = this.taskDetailsService.gscTotalImpressionsPercentChange$;
  gscTotalCtr$ = this.taskDetailsService.gscTotalCtr$;
  gscTotalCtrPercentChange$ = this.taskDetailsService.gscTotalCtrPercentChange$;
  gscTotalPosition$ = this.taskDetailsService.gscTotalPosition$;
  gscTotalPositionPercentChange$ = this.taskDetailsService.gscTotalPositionPercentChange$;

  visitsByPage$ = this.taskDetailsService.visitsByPage$;
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
  
  constructor(private readonly taskDetailsService: TasksDetailsFacade) {}
}
