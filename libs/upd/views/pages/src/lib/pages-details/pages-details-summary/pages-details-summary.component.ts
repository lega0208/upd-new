import { Component} from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';

@Component({
  selector: 'app-page-details-summary',
  templateUrl: './pages-details-summary.component.html',
  styleUrls: ['./pages-details-summary.component.css'],
})
export class PagesDetailsSummaryComponent {

  visitors$ = this.pageDetailsService.visitors$;
  visitorsPercentChange$ = this.pageDetailsService.visitorsPercentChange$;

  visits$ = this.pageDetailsService.visits$;
  visitsPercentChange$ = this.pageDetailsService.visitsPercentChange$;

  pageViews$ = this.pageDetailsService.pageViews$;
  pageViewsPercentChange$ = this.pageDetailsService.pageViewsPercentChange$;

  visitsByDay$ = this.pageDetailsService.visitsByDay$;

  visitsByDeviceType$ = this.pageDetailsService.visitsByDeviceType$;

  topSearchTermsIncrease$ = this.pageDetailsService.topSearchTermsIncrease$;
  topSearchTermsCols = [
    { field: 'term', header: 'Search Term' },
    { field: 'change', header: 'Comparison' },
    { field: 'impressions', header: 'Impressions' },
    { field: 'ctr', header: 'CTR' },
    { field: 'position', header: 'Position' },
  ];

  topSearchTermsDecrease$ = this.pageDetailsService.topSearchTermsDecrease$;

  constructor(private pageDetailsService: PagesDetailsFacade) {}
}
