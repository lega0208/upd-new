import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { FR_CA, LocaleId } from '@dua-upd/upd/i18n';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { GetTableProps } from '@dua-upd/utils-common';
import { createCategoryConfig } from '@dua-upd/upd/utils';
import dayjs from 'dayjs';

type searchAssessmentColTypes = GetTableProps<
  OverviewSearchAnalyticsComponent,
  'searchAssessmentData$'
>;

@Component({
  selector: 'upd-overview-search-analytics',
  templateUrl: './overview-search-analytics.component.html',
  styleUrls: ['./overview-search-analytics.component.css'],
})
export class OverviewSearchAnalyticsComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  gscImpressions$ = this.overviewService.impressions$;
  gscImpressionsPercentChange$ = this.overviewService.impressionsPercentChange$;

  gscCTR$ = this.overviewService.ctr$;
  gscCTRPercentChange$ = this.overviewService.ctrPercentChange$;

  gscAverage$ = this.overviewService.avgRank$;
  gscAveragePercentChange$ = this.overviewService.avgRankPercentChange$;

  GSCSearchTerms$ = this.overviewService.top10GSC$;

  searchAssessmentData$ = this.overviewService.searchAssessmentData$;

  GSCSearchTermsCols: ColumnConfig<GscSearchTermsRow>[] = [];
  searchAssessmentCols: ColumnConfig<searchAssessmentColTypes>[] = [];
  satStart = '';
  satEnd = '';

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    combineLatest([this.searchAssessmentData$, this.currentLang$]).subscribe(
      ([data, lang]) => {
        const dateFormat = lang === FR_CA ? 'D MMM' : 'MMM D';
        this.satStart = `${dayjs
          .utc()
          .subtract(2, 'weeks')
          .startOf('week')
          .locale(lang)
          .format(dateFormat)}`;
        this.satEnd = `${dayjs
          .utc()
          .subtract(2, 'weeks')
          .endOf('week')
          .locale(lang)
          .format(dateFormat)}`;

        // this.CanSearchTermsCols = [
        //   { field: 'Search terms', header: this.i18n.service.translate('search-terms', lang) },
        //   { field: 'Clicks', header: this.i18n.service.translate('clicks', lang) },
        //   { field: 'Comparison', header: this.i18n.service.translate('comparison', lang) }
        // ];
        this.GSCSearchTermsCols = [
          {
            field: '_id',
            header: this.i18n.service.translate('search-terms', lang),
          },
          {
            field: 'clicks',
            header: this.i18n.service.translate('clicks', lang),
            pipe: 'number',
          },
          {
            field: 'percentChange',
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

        this.searchAssessmentCols = [
          {
            field: 'query',
            header: this.i18n.service.translate('search-terms', lang),
          },
          {
            field: 'lang',
            header: this.i18n.service.translate('Search term language', lang),
            filterConfig: {
              type: 'category',
              categories: createCategoryConfig({
                i18n: this.i18n.service,
                data,
                field: 'lang',
              }),
            },
          },
          {
            field: 'url',
            header: this.i18n.service.translate('Target URL', lang),
            type: 'link',
            typeParams: {
              external: true,
              link: 'url',
            },
          },
          {
            field: 'total_searches',
            header: this.i18n.service.translate('Total searches', lang),
          },
          {
            field: 'target_clicks',
            header: this.i18n.service.translate('Target URL clicks', lang),
          },
          {
            field: 'position',
            header: this.i18n.service.translate('avg-rank', lang),
          },
          {
            field: 'pass',
            header: this.i18n.service.translate('Result', lang),
            type: 'text',
            typeParam: 'passFail',
          },
        ];
      }
    );
  }
}

interface GscSearchTermsRow {
  _id: string;
  clicks: number;
  percentChange: number;
  impressions: number;
  ctr: number;
  position: number;
}
