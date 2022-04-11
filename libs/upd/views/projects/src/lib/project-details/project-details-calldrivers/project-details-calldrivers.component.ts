import { MultiSeries } from '@amonsour/ngx-charts';
import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-calldrivers',
  templateUrl: './project-details-calldrivers.component.html',
  styleUrls: ['./project-details-calldrivers.component.css'],
})
export class ProjectDetailsCalldriversComponent {
  bar: MultiSeries = [
    {
      name: 'Feb 27-Mar 05',
      series: [
        { name: 'Benefits', value: 27704 },
        { name: 'e-Services Help Desk', value: 275665 },
        { name: 'ITE', value: 5887 },
        { name: 'C4 - Identity Theft', value: 1208 },
        { name: 'BE', value: 87427 },
      ],
    },
    {
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
  charts = [
    {
      Topic: 'Electronic Services',
      'Number of calls for Feb 27-Mar 05': '72,740',
      'Number of calls for Mar 06-Mar 12': '68,306',
    },
    {
      Topic: 'COVID-19',
      'Number of calls for Feb 27-Mar 05': '43,549',
      'Number of calls for Mar 06-Mar 12': '52,792',
    },
    {
      Topic: 'Account Maintenance',
      'Number of calls for Feb 27-Mar 05': '38,342',
      'Number of calls for Mar 06-Mar 12': '41,206',
    },
    {
      Topic: 'Print requests',
      'Number of calls for Feb 27-Mar 05': '27,230',
      'Number of calls for Mar 06-Mar 12': '26,128',
    },
    {
      Topic: 'Payments to the CRA',
      'Number of calls for Feb 27-Mar 05': '20,663',
      'Number of calls for Mar 06-Mar 12': '22,806',
    },
  ];
  chartsCols: ColumnConfig[] = [
    { field: 'Topic', header: 'Topic' },
    {
      field: 'Number of calls for Feb 27-Mar 05',
      header: 'Number of calls for Feb 27-Mar 05',
    },
    {
      field: 'Number of calls for Mar 06-Mar 12',
      header: 'Number of calls for Mar 06-Mar 12',
    },
  ];

  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade) {}
}
