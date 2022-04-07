import { Component } from '@angular/core';
import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';
import { ColumnConfig } from '@cra-arc/upd-components';
import { OverviewFacade } from '../+state/overview/overview.facade';

@Component({
  selector: 'app-overview-calldrivers',
  templateUrl: './overview-calldrivers.component.html',
  styleUrls: ['./overview-calldrivers.component.css'],
})
export class OverviewCalldriversComponent {

  bar: MultiSeries = barChart;
  charts = charts;
  chartsCols: ColumnConfig[] =  [
    { field: 'Topic', header: 'Topic' },
    { field: 'Number of calls for Feb 27-Mar 05', header: 'Number of calls for Feb 27-Mar 05' },
    { field: 'Number of calls for Mar 06-Mar 12', header: 'Number of calls for Mar 06-Mar 12' },
  ];
  constructor(private overviewService: OverviewFacade) {}
}

const barChart: MultiSeries = [
  {
    name: 'Feb 27-Mar 05',
    series: [
      { name: 'Benefits', value: 27704 },
      { name: 'e-Services Help Desk', value: 275665 },
      { name: 'ITE', value: 5887 },
      { name: 'C4 - Identity Theft', value: 1208 },
      { name: 'BE', value: 87427 },
    ],
  },{
    name: 'Mar 06-Mar 12',
    series: [
      { name: 'Benefits', value: 24704 },
      { name: 'e-Services Help Desk', value: 277665 },
      { name: 'ITE', value: 6255 },
      { name: 'C4 - Identity Theft', value: 201 },
      { name: 'BE', value: 81427 },
    ],
  },
  ];

  const charts = [
    {
      "Topic": "Electronic Services",
      "Number of calls for Feb 27-Mar 05": "72,740",
      "Number of calls for Mar 06-Mar 12": "68,306",
    },
    {
      "Topic": "COVID-19",
      "Number of calls for Feb 27-Mar 05": "43,549",
      "Number of calls for Mar 06-Mar 12": "52,792",
    },
    {
      "Topic": "Account Maintenance",
      "Number of calls for Feb 27-Mar 05": "38,342",
      "Number of calls for Mar 06-Mar 12": "41,206",
    },
    {
      "Topic": "Print requests",
      "Number of calls for Feb 27-Mar 05": "27,230",
      "Number of calls for Mar 06-Mar 12": "26,128",
    },
    {
      "Topic": "Payments to the CRA",
      "Number of calls for Feb 27-Mar 05": "20,663",
      "Number of calls for Mar 06-Mar 12": "22,806",
    }
  ]