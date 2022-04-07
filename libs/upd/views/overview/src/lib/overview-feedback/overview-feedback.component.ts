import { Component, OnInit } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import dayjs from 'dayjs';
import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';
import { columnConfig } from '@cra-arc/upd-components';
import { OverviewFacade } from '../+state/overview/overview.facade';

@Component({
  selector: 'app-overview-feedback',
  templateUrl: './overview-feedback.component.html',
  styleUrls: ['./overview-feedback.component.css'],
})
export class OverviewFeedbackComponent {

  taskSurvey = taskSurvey;
  taskSurveyCols: columnConfig[] = [
    { field: 'task', header: 'Task' },
    { field: 'completion', header: 'Task Success Survey Completed' },
  ];

  dyfChart$ = this.overviewService.dyfData$;
  whatWasWrongChart$ = this.overviewService.whatWasWrongData$;

  constructor(private overviewService: OverviewFacade) { }
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