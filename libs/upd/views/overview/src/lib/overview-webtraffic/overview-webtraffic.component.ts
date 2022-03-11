import { Component, OnInit } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import dayjs from 'dayjs';
import { MultiSeries } from '@amonsour/ngx-charts';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { PercentPipe } from '@angular/common';
import { Metrics } from '../query';

@Component({
  selector: 'app-overview-webtraffic',
  templateUrl: './overview-webtraffic.component.html',
  styleUrls: ['./overview-webtraffic.component.css'],
})
export class OverviewWebtrafficComponent implements OnInit {
  uniqueVisitors = 0;
  uniqueVisitorsPrev = 0;
  uniqueVisitorsDiff = 0;
  uniqueVisitorsSign = '';

  visits = 0;
  visitsPrev = 0;

  pageViews = 0;
  pageViewsPrev = 0;

  metrics: Metrics[] = [];

  topPagesChart: any = [];
  topPagesCols: any = [];

  barChartData$ = this.overviewService.overviewData$.pipe(
    map(parseDataForBarchart),
    catchError((e) => {
      console.error(e);

      return of([] as MultiSeries);
    })
  );

  constructor(private overviewService: OverviewFacade) {}

  ngOnInit(): void {
    this.overviewService.init();

    this.uniqueVisitors = 4260300;
    this.uniqueVisitorsPrev = 4500100;

    this.getMetrics(
      'Unique visitors',
      this.uniqueVisitors,
      this.uniqueVisitorsPrev
    );

    this.visits = 8248019;
    this.visitsPrev = 7902234;

    this.getMetrics('Visits', this.visits, this.visitsPrev);

    this.pageViews = 28261637;
    this.pageViewsPrev = 26234645;

    this.getMetrics('Page views', this.pageViews, this.pageViewsPrev);

    this.topPagesChart = topPages.map((items) => ({
      comparison: percDiff(items.visits, items.visitsPrev),
      ...items,
    }));

    this.topPagesCols = [
      { field: 'rank', header: 'Rank' },
      { field: 'page', header: 'Page' },
      { field: 'visits', header: 'Visits' },
      { field: 'comparison', header: 'Comparison' },
    ];
  }

  getMetrics = (name: string, curr: number, prev: number) => {
    const difference = diff(curr, prev);
    const sign = getSign(difference);

    return this.metrics.push({
      metric: name,
      current: curr,
      past: prev,
      arrow: sign[0],
      textStyle: sign[1],
      comparison: absoluteNum(difference),
    });
  };
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

const topPages: any[] = [
  {
    rank: 1,
    page: 'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    visits: 12542,
    visitsPrev: 10212,
  },
  {
    rank: 2,
    page: 'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    visits: 934,
    visitsPrev: 10212,
  },
  {
    rank: 3,
    page: 'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    visits: 12542,
    visitsPrev: 10212,
  },
  {
    rank: 4,
    page: 'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    visits: 12542,
    visitsPrev: 10212,
  },
  {
    rank: 5,
    page: 'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    visits: 12542,
    visitsPrev: 10212,
  },
  {
    rank: 1,
    page: 'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    visits: 12542,
    visitsPrev: 10212,
  },
  {
    rank: 7,
    page: 'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    visits: 12542,
    visitsPrev: 10212,
  },
  {
    rank: 8,
    page: 'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    visits: 12542,
    visitsPrev: 10212,
  },
  {
    rank: 9,
    page: 'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    visits: 12542,
    visitsPrev: 10212,
  },
  {
    rank: 10,
    page: 'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    visits: 12542,
    visitsPrev: 10212,
  },
];
