import { Component, OnInit } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { ColumnConfig } from '@cra-arc/upd-components';
import { isEmpty } from 'rxjs/operators';

import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';


@Component({
  selector: 'app-page-details-search-analytics',
  templateUrl: './pages-details-search-analytics.component.html',
  styleUrls: ['./pages-details-search-analytics.component.css'],
})
export class PagesDetailsSearchAnalyticsComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  totalImpressionsGSC$ = this.pageDetailsService.impressions$;
  totalImpressionsGSCPercentChange$ =
    this.pageDetailsService.impressionsPercentChange$;

  ctrGSC$ = this.pageDetailsService.ctr$;
  ctrGSCPercentChange$ = this.pageDetailsService.ctrPercentChange$;

  avgRankGSC$ = this.pageDetailsService.avgRank$;
  avgRankGSCPercentChange$ = this.pageDetailsService.avgRankPercentChange$;

  topGSCSearchTerms$ = this.pageDetailsService.top25GSCSearchTerms$;
  // topGSCSearchTermsCols = [
  //   { field: 'term', header: 'Search terms' },
  //   { field: 'clicks', header: 'Clicks', pipe: 'number' },
  //   { field: 'change', header: 'Comparison', pipe: 'percent' },
  //   { field: 'impressions', header: 'Impressions', pipe: 'number' },
  //   { field: 'ctr', header: 'CTR (click through rate)', pipe: 'percent' },
  //   { field: 'position', header: 'Position' },
  // ] as ColumnConfig[];

  searchTermsCanada$ = this.pageDetailsService.topSearchTermsIncrease$;
  // searchTermsCanadaCols = [
  //   { field: 'term', header: 'Search terms' },
  //   { field: 'clicks', header: 'Clicks' },
  //   { field: 'change', header: 'Comparison' },
  // ] as ColumnConfig[];

  referrerType$ = this.pageDetailsService.referrerType$;
  // referrerTypeCols = [
  //   { field: 'type', header: 'Type' },
  //   { field: 'value', header: 'Visits', pipe: 'number' },
  //   { field: 'change', header: 'Comparison' },
  // ] as ColumnConfig[];

  constructor(private pageDetailsService: PagesDetailsFacade, private i18n: I18nFacade) {}

  topGSCSearchTermsCols: ColumnConfig[] = [];
  searchTermsCanadaCols: ColumnConfig[] = []; 
  referrerTypeCols: ColumnConfig[] = [];

  ngOnInit(): void {
    const empty = this.referrerType$.pipe(isEmpty());
    console.log(empty);
    empty.subscribe((x) => console.log(x));

    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([
      this.currentLang$
    ]).subscribe(([lang]) => {
      this.topGSCSearchTermsCols = [
        { field: 'term', header: this.i18n.service.translate('search-terms',lang) },
        { field: 'clicks', header: this.i18n.service.translate('clicks',lang), pipe: 'number' },
        { field: 'change', header: this.i18n.service.translate('comparison',lang), pipe: 'percent' },
        { field: 'impressions', header: this.i18n.service.translate('impressions',lang), pipe: 'number' },
        { field: 'ctr', header: this.i18n.service.translate('ctr',lang), pipe: 'percent' },
        { field: 'position', header: this.i18n.service.translate('position',lang) },
      ],
      this.searchTermsCanadaCols = [
        { field: 'term', header: this.i18n.service.translate('search-terms',lang) },
        { field: 'clicks', header: this.i18n.service.translate('clicks',lang) },
        { field: 'change', header: this.i18n.service.translate('comparison',lang) },
      ],
      this.referrerTypeCols = [
        { field: 'type', header: this.i18n.service.translate('type', lang) },
        { field: 'value', header: this.i18n.service.translate('visits', lang), pipe: 'number' },
        { field: 'change', header: this.i18n.service.translate('comparison', lang) },
      ];
    });

  } 
  
}
