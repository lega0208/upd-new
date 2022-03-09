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
  barChartData$ = this.overviewService.overviewData$
    .pipe(
      map(parseDataForBarchart),
      catchError((e) => {
        console.error(e);

        return of([] as MultiSeries);
      })
    );

    singleBarChartData$ = this.overviewService.overviewData$
    .pipe(
      map(parseDataForSinglechart),
      catchError((e) => {
        console.error(e);

        return of([] as SingleSeries);
      })
    );

  constructor(private overviewService: OverviewFacade) {}

  ngOnInit(): void {
    this.overviewService.init();
  }
}

// will move these functions somewhere else
const getWeeklyDatesLabel = (startDate: Date, endDate: Date) => {
  const formattedStartDate = dayjs(startDate).format('MMM D');
  const formattedEndDate = dayjs(endDate).format('MMM D');

  return `${formattedStartDate}-${formattedEndDate}`;
}

const parseDataForBarchart = (data: { visits: number, date: Date }[]): MultiSeries => {
  if (data.length === 0) {
    return [];
  }

  // making a lot of assumptions here... (for the sake of quickly setting up a demo)
  // will need to add some sanity checks / error handling / reasonable defaults
  const prevWeek = data.slice(0, 7);
  const latestWeek = data.slice(7, 14);

  const [
    prevWeekBarchartData,
    latestWeekBarchartData,
  ] = [prevWeek, latestWeek].map((week) => {
    const weekLabel = getWeeklyDatesLabel(week[0].date, week[6].date);

    return week.map((dailyData: { date: Date, visits: number }) => ({
      name: dayjs(dailyData.date).format('dddd'),
      series: [{ name: weekLabel, value: dailyData.visits }]
    }))
  });

  // again, relying on the assumption of perfect data
  return prevWeekBarchartData.map((dailyData, i) => ({
    name: dailyData.name,
    series: [
      ...dailyData.series,
      ...latestWeekBarchartData[i].series
    ]
  })) as MultiSeries;
}

const parseDataForSinglechart = (data: { visits: number, date: Date }[]): SingleSeries => {
  if (data.length === 0) {
    return [];
  }

  // making a lot of assumptions here... (for the sake of quickly setting up a demo)
  // will need to add some sanity checks / error handling / reasonable defaults
  const prevWeek = data.slice(0, 7);
  const latestWeek = data.slice(7, 14);

  const [
    prevWeekBarchartData,
    latestWeekBarchartData,
  ] = [prevWeek, latestWeek].map((week) => {
    const weekLabel = getWeeklyDatesLabel(week[0].date, week[6].date);

    return week.map((dailyData: { date: Date, visits: number }) => ({
      name: dayjs(dailyData.date).format('dddd'),
      value: dailyData.visits
    }))
  });

  // again, relying on the assumption of perfect data
  return prevWeekBarchartData.map((dailyData, i) => ({
    name: dailyData.name,
    value: dailyData.value,
  })) as SingleSeries;
}
