import { Component, inject, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import type { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import type { GetTableProps } from '@dua-upd/utils-common';

type FeedbackCommentsColType = GetTableProps<
  PagesDetailsFeedbackComponent,
  'feedbackComments$'
>;
type FeedbackByTagsColTypes = GetTableProps<
  PagesDetailsFeedbackComponent,
  'feedbackByTagsTable$'
>;

@Component({
  selector: 'upd-page-details-feedback',
  templateUrl: './pages-details-feedback.component.html',
  styleUrls: ['./pages-details-feedback.component.css'],
})
export class PagesDetailsFeedbackComponent implements OnInit {
  private pageDetailsService = inject(PagesDetailsFacade);
  private i18n = inject(I18nFacade);

  currentLang$ = this.i18n.currentLang$;

  dyfChart$ = this.pageDetailsService.dyfData$;
  whatWasWrongChart$ = this.pageDetailsService.whatWasWrongData$;

  dyfTableCols: ColumnConfig<{ name: string; value: number }>[] = [];
  whatWasWrongTableCols: ColumnConfig<{ name: string; value: number }>[] = [];

  dyfChartApex$ = this.pageDetailsService.dyfDataApex$;
  dyfChartLegend: string[] = [];

  whatWasWrongChartLegend: string[] = [];
  whatWasWrongChartApex$ = this.pageDetailsService.whatWasWrongDataApex$;

  feedbackByTagsBarChartData$ = this.pageDetailsService.feedbackByTagsBarChart$;
  apexFeedbackByTagsData$ = this.pageDetailsService.apexFeedbackByTagsData$;

  feedbackComments$ = this.pageDetailsService.feedbackComments$;
  feedbackCommentsCols: ColumnConfig<FeedbackCommentsColType>[] = [];

  feedbackByTagsTable$ = this.pageDetailsService.feedbackByTagsTable$;
  feedbackByTagsTableCols: ColumnConfig<FeedbackByTagsColTypes>[] = [];

  dateRangeLabel$ = this.pageDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.pageDetailsService.comparisonDateRangeLabel$;

  ngOnInit() {
    combineLatest([
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
      this.currentLang$,
    ]).subscribe(([dateRange, comparisonDateRange, lang]) => {
      this.dyfChartLegend = [
        this.i18n.service.translate('yes', lang),
        this.i18n.service.translate('no', lang),
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

      this.feedbackCommentsCols = [
        {
          field: 'date',
          header: this.i18n.service.translate('date', lang),
          pipe: 'date',
        },
        { field: 'tag', header: this.i18n.service.translate('tags', lang) },
        {
          field: 'whats_wrong',
          header: this.i18n.service.translate('d3-www', lang),
        },
        {
          field: 'comment',
          header: this.i18n.service.translate('comment', lang),
        },
      ];

      this.feedbackByTagsTableCols = [
        { field: 'tag', header: this.i18n.service.translate('category', lang) },
        {
          field: 'currValue',
          header: this.i18n.service.translate('# of comments for ', lang, {
            value: dateRange,
          }),
          pipe: 'number',
        },
        {
          field: 'prevValue',
          header: this.i18n.service.translate('# of comments for ', lang, {
            value: comparisonDateRange,
          }),
          pipe: 'number',
        },
      ];
    });
  }
}
