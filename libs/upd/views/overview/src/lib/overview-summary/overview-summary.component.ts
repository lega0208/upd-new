import { Component, OnInit } from '@angular/core';
import { SingleSeries } from '@amonsour/ngx-charts';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { Metrics } from '../query';

@Component({
  selector: 'app-overview-summary',
  templateUrl: './overview-summary.component.html',
  styleUrls: ['./overview-summary.component.css'],
})
export class OverviewSummaryComponent implements OnInit {
  uniqueVisitors = this.overviewService.visitors$;
  uniqueVisitorsPrev = this.overviewService.prevVisitors$;

  visits = this.overviewService.visits$;
  visitsPrev = this.overviewService.prevVisits$;

  pageViews = this.overviewService.views$;
  pageViewsPrev = this.overviewService.prevViews$;

  gscImp = 0;
  gscImpPrev = 0;
  gscCTR = 0;
  gscCTRPrev = 0;
  gscAverage = 0;
  gscAveragePrev = 0;

  metrics: Metrics[] = [];
  gscMetrics: Metrics[] = [];

  taskSurvey: { id: number; task: string; completion: number }[] = [];
  taskSurveyCols: { field: string; header: string }[] = [];

  dyfChart: SingleSeries = [];
  whatWasWrongChart: SingleSeries = [];

  barChartData$ = this.overviewService.visitsByDay$;

  constructor(private overviewService: OverviewFacade) {}

  ngOnInit() {
    this.overviewService.init();

    this.gscImp = 51006993;
    this.gscImpPrev = 48650123;
    this.gscCTR = 0.1;
    this.gscCTRPrev = 0.099;
    this.gscAverage = 5;
    this.gscAveragePrev = 5;

    this.taskSurvey = [
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

    this.taskSurveyCols = [
      { field: 'task', header: 'Task' },
      { field: 'completion', header: 'Task Success Survey Completed' },
    ];

    this.dyfChart = [
      { name: 'Yes', value: 76 },
      { name: 'No', value: 24 },
    ];
    this.whatWasWrongChart = [
      { name: "I can't find the info", value: 76 },
      { name: 'Other reason', value: 24 },
      { name: 'Info is hard to understand', value: 21 },
      { name: "Error/something didn't work", value: 32 },
    ];
  }
}
