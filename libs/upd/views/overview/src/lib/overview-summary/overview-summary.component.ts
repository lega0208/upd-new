import { Component, OnInit } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import dayjs from 'dayjs';
import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';
import { OverviewFacade } from '../+state/overview/overview.facade';

@Component({
  selector: 'app-overview-summary',
  templateUrl: './overview-summary.component.html',
  styleUrls: ['./overview-summary.component.css'],
})
export class OverviewSummaryComponent implements OnInit {
  uniqueVisitors = 0;
  uniqueVisitorsPrev = 0;
  uniqueVisitorsDiff = 0;

  visits = 0;
  visitsPrev = 0;

  pageViews = 0;
  pageViewsPrev = 0;

  taskSurvey: Array<{ id: number; task: string; completion: number }> = [];
  taskSurveyCols: Array<{ field: string; header: string }> = [];

  dyfChart: MultiSeries = [];
  whatWasWrongChart: MultiSeries = [];
  

  barChartData$ = this.overviewService.overviewData$.pipe(
    map(parseDataForBarchart),
    catchError((e) => {
      console.error(e);

      return of([] as MultiSeries);
    })
  );

  singleBarChartData$ = this.overviewService.overviewData$.pipe(
    map(parseDataForSinglechart),
    catchError((e) => {
      console.error(e);

      return of([] as SingleSeries);
    })
  );

  constructor(private overviewService: OverviewFacade) {}

  ngOnInit(): void {
    this.overviewService.init();

    this.uniqueVisitors = 4760300;
    this.uniqueVisitorsPrev = 4500100;
    this.uniqueVisitorsDiff = diffPercent(
      this.uniqueVisitors,
      this.uniqueVisitorsPrev
    );

    this.visits = 8248019;
    this.visitsPrev = 7902234;

    this.pageViews = 28261637;
    this.pageViewsPrev = 26234645;

    this.taskSurvey = taskSurvey;

    this.taskSurveyCols = [
      { field: 'task', header: 'Task' },
      { field: 'completion', header: 'Task Success Survey Completed' },
    ];

    this.dyfChart = dyf;
    this.whatWasWrongChart = whatWasWrong;
  }
}

const diffPercent = (a: number, b: number) => {
  return 100 * Math.abs((a - b) / ((a + b) / 2));
};

// will move these functions somewhere else
const getWeeklyDatesLabel = (startDate: Date, endDate: Date) => {
  const formattedStartDate = dayjs(startDate).format('MMM D');
  const formattedEndDate = dayjs(endDate).format('MMM D');

  return `${formattedStartDate}-${formattedEndDate}`;
};

const parseDataForBarchart = (
  data: { visits: number; date: Date }[]
): MultiSeries => {
  if (data.length === 0) {
    return [];
  }

  // making a lot of assumptions here... (for the sake of quickly setting up a demo)
  // will need to add some sanity checks / error handling / reasonable defaults
  const prevWeek = data.slice(0, 7);
  const latestWeek = data.slice(7, 14);

  const [prevWeekBarchartData, latestWeekBarchartData] = [
    prevWeek,
    latestWeek,
  ].map((week) => {
    const weekLabel = getWeeklyDatesLabel(week[0].date, week[6].date);

    return week.map((dailyData: { date: Date; visits: number }) => ({
      name: dayjs(dailyData.date).format('dddd'),
      series: [{ name: weekLabel, value: dailyData.visits }],
    }));
  });

  // again, relying on the assumption of perfect data
  return prevWeekBarchartData.map((dailyData, i) => ({
    name: dailyData.name,
    series: [...dailyData.series, ...latestWeekBarchartData[i].series],
  })) as MultiSeries;
};

const parseDataForSinglechart = (
  data: { visits: number; date: Date }[]
): SingleSeries => {
  if (data.length === 0) {
    return [];
  }

  // making a lot of assumptions here... (for the sake of quickly setting up a demo)
  // will need to add some sanity checks / error handling / reasonable defaults
  const prevWeek = data.slice(0, 7);
  const latestWeek = data.slice(7, 14);

  const [prevWeekBarchartData, latestWeekBarchartData] = [
    prevWeek,
    latestWeek,
  ].map((week) => {
    const weekLabel = getWeeklyDatesLabel(week[0].date, week[6].date);

    return week.map((dailyData: { date: Date; visits: number }) => ({
      name: dayjs(dailyData.date).format('dddd'),
      value: dailyData.visits,
    }));
  });

  // again, relying on the assumption of perfect data
  return prevWeekBarchartData.map((dailyData, i) => ({
    name: dailyData.name,
    value: dailyData.value,
  })) as SingleSeries;
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
  {
    name: 'Feb20-Feb26',
    series: [
      { name: 'Yes', value: 76 },
      { name: 'No', value: 24 },
    ],
  },
  {
    name: 'Feb27-Mar5',
    series: [
      { name: 'Yes', value: 70 },
      { name: 'No', value: 30 },
    ],
  },
];

const whatWasWrong = [
  {
    name: 'Feb20-Feb26',
    series: [
      { name: 'I can\'t find the info', value: 76 },
      { name: 'Other reason', value: 24 },
      { name: 'Info is hard to understand', value: 21 },
      { name: 'Error/something didn’t work', value: 32 },
      
    ],
  },
  {
    name: 'Feb27-Mar5',
    series: [
      { name: 'I can\'t find the info', value: 76 },
      { name: 'Other reason', value: 24 },
      { name: 'Info is hard to understand', value: 21 },
      { name: 'Error/something didn’t work', value: 32 },
    ],
  },
];