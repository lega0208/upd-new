import { Component, inject, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import type { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import { OverviewFacade } from '../+state/overview/overview.facade';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

@Component({
  selector: 'upd-overview-feedback',
  templateUrl: './overview-feedback.component.html',
  styleUrls: ['./overview-feedback.component.css'],
})
export class OverviewFeedbackComponent implements OnInit {
  private overviewService = inject(OverviewFacade);
  private i18n = inject(I18nFacade);
  currentLang$ = this.i18n.currentLang$;

  fullDateRangeLabel$ = this.overviewService.fullDateRangeLabel$;
  fullComparisonDateRangeLabel$ = this.overviewService.fullComparisonDateRangeLabel$;

  dateRangeLabel$ = this.overviewService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.overviewService.comparisonDateRangeLabel$;

  dyfChart$ = this.overviewService.dyfData$;
  whatWasWrongChart$ = this.overviewService.whatWasWrongData$;
  comparisonFeedbackTable$ = this.overviewService.comparisonFeedbackTable$;
  comparisonFeedbackPagesTable$ =
    this.overviewService.comparisonFeedbackPagesTable$;

  dyfChartApex$ = this.overviewService.dyfDataApex$;
  dyfChartLegend: string[] = [];

  whatWasWrongChartLegend: string[] = [];
  whatWasWrongChartApex$ = this.overviewService.whatWasWrongDataApex$;

  dyfTableCols: ColumnConfig<{
    name: string;
    currValue: number;
    prevValue: number;
  }>[] = [];
  whatWasWrongTableCols: ColumnConfig<{ name: string; value: number }>[] = [];
  feedbackCols: ColumnConfig<{
    name: string;
    currValue: number;
    percentChange: number;
  }>[] = [];
  feedbackPagesTableCols: ColumnConfig<{
    title: string;
    name: string;
    currValue: number;
    percentChange: number;
  }>[] = [];
  langLink = 'en';

  ngOnInit() {
    combineLatest([this.currentLang$, this.dateRangeLabel$, this.comparisonDateRangeLabel$]).subscribe(([lang, dateRange, comparisonDateRange]) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';

      // const dateFormat =
      // this.langLink === 'en' ? 'D MMM YYYY' : 'MMM D YYYY';

      // this.dyfLabels = [
      //   dayjs.utc(currentDate).locale(lang).format(dateFormat),
      //   dayjs.utc(comparisonDate).locale(lang).format(dateFormat)
      // ]

      this.dyfChartLegend = [
        this.i18n.service.translate('yes', lang),
        this.i18n.service.translate('no', lang),
      ];
      this.dyfTableCols = [
        {
          field: 'name',
          header: this.i18n.service.translate('Selection', lang),
        },
        {
          field: 'currValue',
          header: dateRange,
          pipe: 'number',
        },
        {
          field: 'prevValue',
          header: comparisonDateRange,
          pipe: 'number',
        },
      ];

      this.whatWasWrongChartLegend = [
        this.i18n.service.translate('d3-cant-find-info', lang),
        this.i18n.service.translate('d3-other', lang),
        this.i18n.service.translate('d3-hard-to-understand', lang),
        this.i18n.service.translate('d3-error', lang),
      ];

      this.whatWasWrongTableCols = [
        { field: 'name', header: this.i18n.service.translate('d3-www', lang) },
        {
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
      ];
      this.feedbackCols = [
        {
          field: 'name',
          header: this.i18n.service.translate('program-service', lang),
        },
        {
          field: 'currValue',
          header: this.i18n.service.translate('# of comments', lang),
          pipe: 'number',
        },
        {
          field: 'percentChange',
          header: this.i18n.service.translate('comparison', lang),
          pipe: 'percent',
        },
      ];
      this.feedbackPagesTableCols = [
        {
          field: 'name',
          header: this.i18n.service.translate('page', lang),
          type: 'link',
          typeParams: { link: 'name', external: true },
        },
        {
          field: 'currValue',
          header: this.i18n.service.translate('# of comments', lang),
          pipe: 'number',
          type: 'link',
          typeParams: {
            preLink: '/' + this.langLink + '/pages',
            link: 'id',
            postLink: 'pagefeedback',
          },
        },
        {
          field: 'percentChange',
          header: this.i18n.service.translate('comparison', lang),
          pipe: 'percent',
        },
      ];
    });
  }
}
