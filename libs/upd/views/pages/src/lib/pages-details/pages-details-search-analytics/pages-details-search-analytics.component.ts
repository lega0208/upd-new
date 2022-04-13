import { Component, OnInit } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { ColumnConfig } from '@cra-arc/upd-components';
import { isEmpty } from 'rxjs/operators';

@Component({
  selector: 'app-page-details-search-analytics',
  templateUrl: './pages-details-search-analytics.component.html',
  styleUrls: ['./pages-details-search-analytics.component.css'],
})
export class PagesDetailsSearchAnalyticsComponent implements OnInit {
  totalImpressionsGSC$ = this.pageDetailsService.impressions$;
  totalImpressionsGSCPercentChange$ =
    this.pageDetailsService.impressionsPercentChange$;

  ctrGSC$ = this.pageDetailsService.ctr$;
  ctrGSCPercentChange$ = this.pageDetailsService.ctrPercentChange$;

  avgRankGSC$ = this.pageDetailsService.avgRank$;
  avgRankGSCPercentChange$ = this.pageDetailsService.avgRankPercentChange$;

  topGSCSearchTerms$ = this.pageDetailsService.top25GSCSearchTerms$;
  topGSCSearchTermsCols = [
    { field: 'term', header: 'Search terms' },
    { field: 'clicks', header: 'Clicks', pipe: 'number' },
    { field: 'change', header: 'Comparison', pipe: 'percent' },
    { field: 'impressions', header: 'Impressions', pipe: 'number' },
    { field: 'ctr', header: 'CTR (click through rate)', pipe: 'percent' },
    { field: 'position', header: 'Position' },
  ] as ColumnConfig[];

  searchTermsCanada$ = this.pageDetailsService.topSearchTermsIncrease$;
  searchTermsCanadaCols = [
    { field: 'term', header: 'Search terms' },
    { field: 'clicks', header: 'Clicks' },
    { field: 'change', header: 'Comparison' },
  ] as ColumnConfig[];

  referrerType$ = this.pageDetailsService.referrerType$;
  referrerTypeCols = [
    { field: 'type', header: 'Type' },
    { field: 'value', header: 'Visits', pipe: 'number' },
    { field: 'change', header: 'Comparison' },
  ] as ColumnConfig[];

  ngOnInit(): void {
    const empty = this.referrerType$.pipe(isEmpty());
    console.log(empty);
    empty.subscribe((x) => console.log(x));
  }

  constructor(private pageDetailsService: PagesDetailsFacade) {}
}
