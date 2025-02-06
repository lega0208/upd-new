import { Component, computed, inject } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import type { ColumnConfig } from '@dua-upd/types-common';
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
export class PagesDetailsSearchAnalyticsComponent {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);
  currentLang = this.i18n.currentLang;

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

  topGscSearchTermsCols = computed<ColumnConfig<GscSearchTermsColTypes>[]>(() => [
    {
      field: 'term',
      header: this.i18n.service.translate('search-terms', this.currentLang()),
    },
    {
      field: 'clicks',
      header: this.i18n.service.translate('clicks', this.currentLang()),
      pipe: 'number',
    },
    {
      field: 'change',
      header: this.i18n.service.translate('change', this.currentLang()),
      pipe: 'percent',
    },
    {
      field: 'impressions',
      header: this.i18n.service.translate('impressions', this.currentLang()),
      pipe: 'number',
    },
    {
      field: 'ctr',
      header: this.i18n.service.translate('ctr', this.currentLang()),
      pipe: 'percent',
    },
    {
      field: 'position',
      header: this.i18n.service.translate('position', this.currentLang()),
      pipe: 'number',
      pipeParam: '1.0-2',
    },
  ]);

  searchTermsCanadaCols = computed<ColumnConfig[]>(() => [
    {
      field: 'term',
      header: this.i18n.service.translate('search-terms', this.currentLang()),
    },
    {
      field: 'clicks',
      header: this.i18n.service.translate('clicks', this.currentLang()),
    },
    {
      field: 'change',
      header: this.i18n.service.translate('comparison', this.currentLang()),
    },
  ]);

  referrerTypeCols = computed<ColumnConfig<ReferrerTypeColTypes>[]>(() => [
    { field: 'type', header: this.i18n.service.translate('type', this.currentLang()) },
    {
      field: 'value',
      header: this.i18n.service.translate('visits', this.currentLang()),
      pipe: 'number',
    },
    {
      field: 'change',
      header: this.i18n.service.translate('change', this.currentLang()),
      pipe: 'percent',
    },
  ]);
}
