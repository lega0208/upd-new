import { Component } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';

@Component({
  selector: 'app-page-details-search-analytics',
  templateUrl: './pages-details-search-analytics.component.html',
  styleUrls: ['./pages-details-search-analytics.component.css'],
})
export class PagesDetailsSearchAnalyticsComponent {

  totalImpressionsGSC$ = this.pageDetailsService.visitors$;
  totalImpressionsGSCPercentChange$ = this.pageDetailsService.visitorsPercentChange$;

  ctrGSC$ = this.pageDetailsService.visits$;
  ctrGSCPercentChange$ = this.pageDetailsService.visitsPercentChange$;

  avgRankGSC$ = this.pageDetailsService.pageViews$;
  avgRankGSCPercentChange$ = this.pageDetailsService.pageViewsPercentChange$;

  topGSCSearchTerms$ = this.pageDetailsService.topSearchTermsIncrease$;
  topGSCSearchTermsCols = [
    { field: 'term', header: 'Search terms' },
    { field: 'clicks', header: 'Clicks' },
    { field: 'change', header: 'Comparison' },
    { field: 'impressions', header: 'Impressions' },
    { field: 'ctr', header: 'CTR (click through rate)' },
    { field: 'position', header: 'Position' },
  ];

  searchTermsCanada$ = this.pageDetailsService.topSearchTermsIncrease$;
  searchTermsCanadaCols = [
    { field: 'term', header: 'Search terms' },
    { field: 'clicks', header: 'Clicks' },
    { field: 'change', header: 'Comparison' },
  ];

  referrerType$ = this.pageDetailsService.topSearchTermsIncrease$;
  referrerTypeCols = [
    { field: 'referrer', header: 'Type' },
    { field: 'visits', header: 'Visits' },
    { field: 'change', header: 'Comparison' },
  ];


  constructor(private pageDetailsService: PagesDetailsFacade) {}
}
