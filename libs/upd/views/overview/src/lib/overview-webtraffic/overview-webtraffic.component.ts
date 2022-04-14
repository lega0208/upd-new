import { Component } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { OverviewFacade } from '../+state/overview/overview.facade';

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
  topPagesCols: ColumnConfig[] = [
    { field: '_id', header: 'URL' },
    { field: 'visits', header: 'Visits', pipe: 'number' },
    { field: 'comparison', header: 'Comparison' },
  ];

  barChartData$ = this.overviewService.visitsByDay$;
  barTable$ = this.overviewService.barTable$;

  label = 'Visits';

  dateRangeLabel$ = this.overviewService.dateRangeLabel$;

  barTableCols: ColumnConfig[] = [
    { field: 'name', header: 'Dates' },
    {
      field: 'currValue',
      header: 'Visits for ' + this.dateRangeLabel$,
      pipe: 'number',
    },
    { field: 'prevValue', header: 'Visits for ', pipe: 'number' },
  ];

  constructor(private overviewService: OverviewFacade) {}
}
