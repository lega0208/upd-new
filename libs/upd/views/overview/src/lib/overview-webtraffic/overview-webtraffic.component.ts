import { Component } from '@angular/core';

import { columnConfig } from '@cra-arc/upd-components';
import { OverviewFacade } from '@cra-arc/upd/views/overview';

@Component({
  selector: 'app-overview-webtraffic',
  templateUrl: './overview-webtraffic.component.html',
  styleUrls: ['./overview-webtraffic.component.css'],
})
export class OverviewWebtrafficComponent {
  uniqueVisitors$ = this.overviewService.visitors$;
  uniqueVisitorsPercentChange$ = this.overviewService.visitorsPercentChange$;

  visits$ = this.overviewService.visits$;
  visitsPercentChange$ = this.overviewService.visitsPercentChange$;

  pageViews$ = this.overviewService.views$;
  pageViewsPercentChange$ = this.overviewService.viewsPercentChange$;

  topPagesData$ = this.overviewService.topPagesVisited$;
  topPagesCols: columnConfig[] = [
    { field: 'rank', header: 'Rank' },
    { field: '_id', header: 'URL' },
    { field: 'visits', header: 'Visits', pipe: 'number' },
    { field: 'comparison', header: 'Comparison' },
  ];

  barChartData$ = this.overviewService.visitsByDay$;

  // topPagesData$ = this.pagesHomeService.pagesHomeTableData$;

  // columns: columnConfig[] = [
  //   {
  //     field: 'url',
  //     header: 'Url',
  //     type: 'link',
  //     typeParam: '_id',
  //     tooltip: 'Url tooltip',
  //   },
  //   { field: 'title', header: 'Title', tooltip: 'Title tooltip' },
  //   {
  //     field: 'visits',
  //     header: 'Visits',
  //     pipe: 'number',
  //   },
  // ];

  constructor(private overviewService: OverviewFacade) {}

}

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
