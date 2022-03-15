import { Component, OnInit } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import dayjs from 'dayjs';
import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';

@Component({
  selector: 'app-overview-feedback',
  templateUrl: './overview-feedback.component.html',
  styleUrls: ['./overview-feedback.component.css'],
})
export class OverviewFeedbackComponent implements OnInit {

  taskSurvey: { id: number; task: string; completion: number }[] = [];
  taskSurveyCols: { field: string; header: string }[] = [];

  dyfChart: SingleSeries = [];
  whatWasWrongChart: SingleSeries = [];

  constructor() {}

  ngOnInit(): void {
    this.taskSurvey = taskSurvey;

    this.taskSurveyCols = [
      { field: 'task', header: 'Task' },
      { field: 'completion', header: 'Task Success Survey Completed' },
    ];

    this.dyfChart = dyf;
    this.whatWasWrongChart = whatWasWrong;
  }
}

const diff = (a: number, b: number) => {
  return (a - b) / b;
};

const percDiff = (a: number, b: number) => {
  const diff = Math.round(((a - b) / b) * 100);
  return diff > 0 ? `+ ${Math.abs(diff)}%` : `- ${Math.abs(diff)}%`;
};

const absoluteNum = (num: number) => {
  return Math.abs(num);
};

const getSign = (diff: number) => {
  const m =
    Math.sign(diff) === -1
      ? 'arrow_downward:text-danger'
      : 'arrow_upward:text-success';
  return m.split(':');
};

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

const dyf = [
  { name: 'Yes', value: 76 },
      { name: 'No', value: 24 },
];

const whatWasWrong = [
      { name: "I can't find the info", value: 76 },
      { name: 'Other reason', value: 24 },
      { name: 'Info is hard to understand', value: 21 },
      { name: "Error/something didn't work", value: 32 },
];
