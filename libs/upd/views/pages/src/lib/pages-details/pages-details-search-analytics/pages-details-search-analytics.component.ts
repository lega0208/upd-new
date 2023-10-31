import { Component, inject, OnInit } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import type { ColumnConfig } from '@dua-upd/upd-components';
import type { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import type { GetTableProps } from '@dua-upd/utils-common';
import { map } from 'rxjs';

type GscSearchTermsColTypes = GetTableProps<
  PagesDetailsSearchAnalyticsComponent,
  'topGSCSearchTerms$'
>;
type ReferrerTypeColTypes = GetTableProps<
  PagesDetailsSearchAnalyticsComponent,
  'referrerType$'
>;

@Component({
  selector: 'upd-page-details-search-analytics',
  templateUrl: './pages-details-search-analytics.component.html',
  styleUrls: ['./pages-details-search-analytics.component.css'],
})
export class PagesDetailsSearchAnalyticsComponent implements OnInit {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);

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

  topSearchTerms$ = this.pageDetailsService.topSearchTerms$.pipe(
    map((searchTerms) => [...searchTerms]),
  );

  searchTermsColConfig$ = this.pageDetailsService.searchTermsColConfig$;

  referrerType$ = this.pageDetailsService.referrerType$;

  topGSCSearchTermsCols: ColumnConfig<GscSearchTermsColTypes>[] = [];
  searchTermsCanadaCols: ColumnConfig[] = [];
  referrerTypeCols: ColumnConfig<ReferrerTypeColTypes>[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    this.currentLang$.subscribe((lang) => {
      this.topGSCSearchTermsCols = [
        {
          field: 'term',
          header: this.i18n.service.translate('search-terms', lang),
        },
        {
          field: 'clicks',
          header: this.i18n.service.translate('clicks', lang),
          pipe: 'number',
        },
        {
          field: 'change',
          header: this.i18n.service.translate('comparison', lang),
          pipe: 'percent',
        },
        {
          field: 'impressions',
          header: this.i18n.service.translate('impressions', lang),
          pipe: 'number',
        },
        {
          field: 'ctr',
          header: this.i18n.service.translate('ctr', lang),
          pipe: 'percent',
        },
        {
          field: 'position',
          header: this.i18n.service.translate('position', lang),
          pipe: 'number',
          pipeParam: '1.0-2',
        },
      ];

      this.searchTermsCanadaCols = [
        {
          field: 'term',
          header: this.i18n.service.translate('search-terms', lang),
        },
        {
          field: 'clicks',
          header: this.i18n.service.translate('clicks', lang),
        },
        {
          field: 'change',
          header: this.i18n.service.translate('comparison', lang),
        },
      ];

      this.referrerTypeCols = [
        { field: 'type', header: this.i18n.service.translate('type', lang) },
        {
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
        {
          field: 'change',
          header: this.i18n.service.translate('comparison', lang),
          pipe: 'percent',
        },
      ];
    });
  }
}
