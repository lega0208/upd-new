import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA, LocaleId } from '@dua-upd/upd/i18n';
import { OverviewFacade } from '../+state/overview/overview.facade';

@Component({
  selector: 'upd-overview-feedback',
  templateUrl: './overview-feedback.component.html',
  styleUrls: ['./overview-feedback.component.css'],
})
export class OverviewFeedbackComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  dyfChart$ = this.overviewService.dyfData$;
  whatWasWrongChart$ = this.overviewService.whatWasWrongData$;
  comparisonFeedbackTable$ = this.overviewService.comparisonFeedbackTable$;
  comparisonFeedbackPagesTable$ =
    this.overviewService.comparisonFeedbackPagesTable$;

  dyfChartApex$ = this.overviewService.dyfDataApex$;
  dyfChartLegend: string[] = [];

  whatWasWrongChartLegend: string[] = [];
  whatWasWrongChartApex$ = this.overviewService.whatWasWrongDataApex$;

  dyfTableCols: ColumnConfig<{ name: string; value: number }>[] = [];
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

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';

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
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
      ];

      this.whatWasWrongChartLegend = [
        this.i18n.service.translate('d3-cant-find-info', lang),
        this.i18n.service.translate('d3-other', lang),
        this.i18n.service.translate('d3-hard-to-understand', lang),
        this.i18n.service.translate('d3-error', lang),
      ];

      this.dyfTableCols = [
        {
          field: 'name',
          header: this.i18n.service.translate('Selection', lang),
        },
        {
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
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
