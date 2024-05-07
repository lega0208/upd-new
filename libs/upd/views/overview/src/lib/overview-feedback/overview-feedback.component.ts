import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { combineLatest } from 'rxjs';
import type { ColumnConfig, FeedbackWithScores, WordRelevance } from '@dua-upd/types-common';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import { OverviewFacade } from '../+state/overview/overview.facade';

@Component({
  selector: 'upd-overview-feedback',
  templateUrl: './overview-feedback.component.html',
  styleUrls: ['./overview-feedback.component.css'],
})
export class OverviewFeedbackComponent implements OnInit {
  private overviewService = inject(OverviewFacade);
  private i18n = inject(I18nFacade);
  currentLang$ = this.i18n.currentLang$;

  currentTotalComments$ = this.overviewService.currentTotalComments$;
  commentsPercentChange$ = this.overviewService.commentsPercentChange$;

  fullDateRangeLabel$ = this.overviewService.fullDateRangeLabel$;
  fullComparisonDateRangeLabel$ =
    this.overviewService.fullComparisonDateRangeLabel$;

  dateRangeLabel$ = this.overviewService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.overviewService.comparisonDateRangeLabel$;

  dyfChart$ = this.overviewService.dyfData$;
  whatWasWrongChart$ = this.overviewService.whatWasWrongData$;
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

  feedbackPagesTotalTableCols: ColumnConfig<{
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

  normalizationStrength = signal(0.5);

  feedbackMostRelevant = this.overviewService.feedbackMostRelevant;

  mostRelevantCommentsEn = computed(
    () => this.feedbackMostRelevant().en.comments,
  );
  mostRelevantWordsEn = computed(() => this.feedbackMostRelevant().en.words);

  mostRelevantCommentsFr = computed(
    () => this.feedbackMostRelevant().fr.comments,
  );
  mostRelevantWordsFr = computed(() => this.feedbackMostRelevant().fr.words);

  mostRelevantCommentsColumns: ColumnConfig<FeedbackWithScores>[] = [
    // { field: 'date', header: 'Date', pipe: 'date' },
    // { field: 'url', header: 'URL' },
    { field: 'comment', header: 'Comment', width: '400px' },
    { field: 'normalization_factor', header: 'Normalization factor', pipe: 'number', width: '15px' },
    { field: 'andre_score', header: 'Word Score', pipe: 'number', width: '15px' },
    { field: 'tf_idf', header: 'Comment score', pipe: 'number', width: '15px' },
    { field: 'tf_idf_logscale', header: 'Comment score (log scale)', pipe: 'number', width: '15px' },
    { field: 'tf_idf_ipf', header: 'Page score', pipe: 'number', width: '15px' },
    { field: 'andre_score_normalized', header: 'Word Score (normalized)', pipe: 'number', width: '15px' },
    { field: 'tf_idf_normalized', header: 'Comment score (normalized)', pipe: 'number', width: '15px' },
    { field: 'tf_idf_logscale_normalized', header: 'Comment score (log scale, normalized)', pipe: 'number', width: '15px' },
    { field: 'tf_idf_ipf_normalized', header: 'Page score (normalized)', pipe: 'number', width: '15px' },
  ];

  mostRelevantWordsColumns: ColumnConfig<WordRelevance>[] = [
    { field: 'words', header: 'Word', width: '10px' },
    { field: 'term_occurrences_total', header: 'Term occurrences', pipe: 'number', width: '10px' },
    { field: 'comment_occurrences_total', header: 'Comment occurrences', pipe: 'number', width: '10px' },
    { field: 'page_occurrences_total', header: 'Page occurrences', pipe: 'number', width: '10px' },
    { field: 'andre_score', header: 'Word Score', pipe: 'number', columnClass: 'text-wrap', width: '10px' },
    { field: 'tf_idf', header: 'Comment score', pipe: 'number', width: '10px' },
    { field: 'tf_idf_logscale', header: 'Comment score (log scale)', pipe: 'number', width: '200px' },
    { field: 'tf_idf_ipf', header: 'Page score', pipe: 'number', width: '20px' },
    { field: 'tf_idf_ipf_logscale', header: 'Page score (log scale)', pipe: 'number', width: '200px' },
  ]

  recalculateMostRelevant() {
    this.overviewService.getMostRelevantFeedback(this.normalizationStrength());
  }

  ngOnInit() {
    combineLatest([
      this.currentLang$,
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
    ]).subscribe(([lang, dateRange, comparisonDateRange]) => {
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
