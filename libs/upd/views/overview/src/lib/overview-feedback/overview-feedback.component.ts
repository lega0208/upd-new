import { Component, computed, inject, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import type {
  ColumnConfig,
  FeedbackWithScores,
  WordRelevance,
} from '@dua-upd/types-common';
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
  commentsByPage$ = this.overviewService.commentsByPage$;

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
    url: string;
    sum: number;
    percentChange: number | null;
  }>[] = [];
  langLink = 'en';

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
    { field: 'rank', header: 'Rank', width: '10px', center: true },
    { field: 'date', header: 'Date', pipe: 'date', width: '100px' },
    { field: 'url', header: 'URL' },
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
    // {
    //   field: 'page_occurrences',
    //   header: 'Page occurrences',
    //   pipe: 'number',
    //   width: '10px',
    // },
  ];

  recalculateMostRelevant() {
    this.overviewService.getMostRelevantFeedback();
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
          field: 'url',
          header: this.i18n.service.translate('page', lang),
          type: 'link',
          typeParams: { link: 'url', external: true },
        },
        {
          field: 'sum',
          header: this.i18n.service.translate('# of comments', lang),
          pipe: 'number',
          type: 'link',
          typeParams: {
            preLink: '/' + this.langLink + '/pages',
            link: '_id',
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
