import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { LocaleId } from '@dua-upd/upd/i18n';
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
  comparisonFeedbackPagesTable$ = this.overviewService.comparisonFeedbackPagesTable$; 

  dyfTableCols: ColumnConfig<{ name: string; value: number }>[] = [];
  whatWasWrongTableCols: ColumnConfig<{ name: string; value: number }>[] = [];
  feedbackCols: ColumnConfig<{
    name: string;
    currValue: number;
    percentChange: number
  }>[] = [];
  feedbackPagesTableCols: ColumnConfig<{
    name: string;
    currValue: number;
    percentChange: number;
  }>[] = [];

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    combineLatest([this.currentLang$]).subscribe(([lang]) => {
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
