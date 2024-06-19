import { Component, computed, inject, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import type {
  ColumnConfig,
  FeedbackWithScores,
  WordRelevance,
} from '@dua-upd/types-common';
import { I18nFacade } from '@dua-upd/upd/state';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'upd-page-details-feedback',
  templateUrl: './pages-details-feedback.component.html',
  styleUrls: ['./pages-details-feedback.component.css'],
})
export class PagesDetailsFeedbackComponent implements OnInit {
  private pageDetailsService = inject(PagesDetailsFacade);
  private i18n = inject(I18nFacade);

  currentLang$ = this.i18n.currentLang$;

  pageLang = toSignal(this.pageDetailsService.pageLang$);

  fullDateRangeLabel$ = this.pageDetailsService.fullDateRangeLabel$;
  fullComparisonDateRangeLabel$ =
    this.pageDetailsService.fullComparisonDateRangeLabel$;

  dyfChart$ = this.pageDetailsService.dyfData$;
  whatWasWrongChart$ = this.pageDetailsService.whatWasWrongData$;

  dyfTableCols: ColumnConfig<{
    name: string;
    currValue: number;
    prevValue: string;
  }>[] = [];
  whatWasWrongTableCols: ColumnConfig<{ name: string; value: number }>[] = [];

  dyfChartApex$ = this.pageDetailsService.dyfDataApex$;
  dyfChartLegend: string[] = [];

  whatWasWrongChartLegend: string[] = [];
  whatWasWrongChartApex$ = this.pageDetailsService.whatWasWrongDataApex$;

  dateRangeLabel$ = this.pageDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.pageDetailsService.comparisonDateRangeLabel$;

  feedbackMostRelevant = this.pageDetailsService.feedbackMostRelevant;

  numComments = this.pageDetailsService.numComments;
  numCommentsPercentChange = this.pageDetailsService.numCommentsPercentChange;

  mostRelevantComments = computed(
    () =>
      this.pageLang() &&
      this.feedbackMostRelevant()[this.pageLang() as 'en' | 'fr'].comments,
  );
  mostRelevantWords = computed(
    () =>
      this.pageLang() &&
      this.feedbackMostRelevant()[this.pageLang() as 'en' | 'fr'].words,
  );

  mostRelevantCommentsColumns: ColumnConfig<FeedbackWithScores>[] = [
    { field: 'rank', header: 'Rank', width: '10px', center: true },
    { field: 'date', header: 'Date', pipe: 'date', width: '50px' },
    { field: 'owners', header: 'Owner', width: '10px', hide: true },
    { field: 'sections', header: 'Section', hide: true },
    { field: 'comment', header: 'Comment', width: '400px' },
  ];

  mostRelevantWordsColumns: ColumnConfig<WordRelevance>[] = [
    { field: 'word', header: 'Word', width: '10px' },
    {
      field: 'word_occurrences',
      header: 'Term occurrences',
      pipe: 'number',
      width: '10px',
    },
    {
      field: 'comment_occurrences',
      header: 'Comment occurrences',
      pipe: 'number',
      width: '10px',
    },
  ];

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
      this.whatWasWrongTableCols = [
        { field: 'name', header: this.i18n.service.translate('d3-www', lang) },
        {
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
      ];
    });
  }
}
