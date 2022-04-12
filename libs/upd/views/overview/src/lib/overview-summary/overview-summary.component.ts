import { Component } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { Metrics } from '../query';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-overview-summary',
  templateUrl: './overview-summary.component.html',
  styleUrls: ['./overview-summary.component.css'],
})
export class OverviewSummaryComponent {
  uniqueVisitors$ = this.overviewService.visitors$;
  uniqueVisitorsPercentChange$ = this.overviewService.visitorsPercentChange$;

  visits$ = this.overviewService.visits$;
  visitsPercentChange$ = this.overviewService.visitsPercentChange$;

  pageViews$ = this.overviewService.views$;
  pageViewsPercentChange$ = this.overviewService.viewsPercentChange$;

  gscImpressions$ = this.overviewService.impressions$;
  gscImpressionsPercentChange$ = this.overviewService.impressionsPercentChange$;

  gscCTR$ = this.overviewService.ctr$;
  gscCTRPercentChange$ = this.overviewService.ctrPercentChange$;

  gscAverage$ = this.overviewService.avgRank$;
  gscAveragePercentChange$ = this.overviewService.avgRankPercentChange$;

  taskSurvey: { id: number; task: string; completion: number }[] = taskSurvey;
  taskSurveyCols: { field: string; header: string }[] = taskSurveyCols;

  dyfChart$ = this.overviewService.dyfData$;
  whatWasWrongChart$ = this.overviewService.whatWasWrongData$;

  dyfTableCols: ColumnConfig[] = [
    { field: 'name', header: 'Selection' },
    { field: 'value', header: 'Visits', pipe: 'number' },
  ]
  whatWasWrongTableCols: ColumnConfig[] = [
    { field: 'name', header: 'What was wrong' },
    { field: 'value', header: 'Visits', pipe: 'number' },
  ]

  barChartData$ = this.overviewService.visitsByDay$;

  constructor(private overviewService: OverviewFacade, public translateService: TranslateService) {}
}

const taskSurvey = [
  { id: 1, task: 'Shufflester', completion: 191 },
  { id: 2, task: 'Yotz', completion: 189 },
  { id: 3, task: 'Shuffletag', completion: 65 },
  { id: 4, task: 'Feednation', completion: 132 },
  { id: 5, task: 'Zoonder', completion: 153 },
  { id: 6, task: 'Jabbersphere', completion: 97 },
  { id: 7, task: 'Devpulse', completion: 84 },
  { id: 8, task: 'Photofeed', completion: 172 },
  { id: 9, task: 'Meemm', completion: 205 },
  { id: 10, task: 'Jetwire', completion: 176 },
];

const taskSurveyCols = [
  { field: 'task', header: 'Task' },
  { field: 'completion', header: 'Task Success Survey Completed' },
];