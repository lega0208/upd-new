import { Component, inject, OnInit } from '@angular/core';
import type { ColumnConfig } from '@dua-upd/types-common';
import { I18nFacade } from '@dua-upd/upd/state';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';
import { EN_CA } from '@dua-upd/upd/i18n';
import type { GetTableProps } from '@dua-upd/utils-common';
import { combineLatest } from 'rxjs';

type FeedbackCommentsColType = GetTableProps<
  TaskDetailsFeedbackComponent,
  'feedbackComments$'
>;

@Component({
  selector: 'upd-task-details-feedback',
  templateUrl: './task-details-feedback.component.html',
  styleUrls: ['./task-details-feedback.component.css'],
})
export class TaskDetailsFeedbackComponent implements OnInit {
  private i18n = inject(I18nFacade);
  private readonly taskDetailsService = inject(TasksDetailsFacade);

  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  fullDateRangeLabel$ = this.taskDetailsService.fullDateRangeLabel$;
  fullComparisonDateRangeLabel$ =
    this.taskDetailsService.fullComparisonDateRangeLabel$;

  visitsByPage$ =
    this.taskDetailsService.visitsByPageFeedbackWithPercentChange$;
  visitsByPageCols: ColumnConfig[] = [];

  dyfChart$ = this.taskDetailsService.dyfData$;
  whatWasWrongChart$ = this.taskDetailsService.whatWasWrongData$;

  dyfTableCols: ColumnConfig<{ name: string; currValue: number; prevValue: string }>[] = [];
  whatWasWrongTableCols: ColumnConfig[] = [];

  feedbackComments$ = this.taskDetailsService.feedbackComments$;
  feedbackTotalComments$ = this.taskDetailsService.feedbackTotalComments$;
  commentsPercentChange$ = this.taskDetailsService.commentsPercentChange$;
  feedbackCommentsCols: ColumnConfig<FeedbackCommentsColType>[] = [];

  dateRangeLabel$ = this.taskDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.taskDetailsService.comparisonDateRangeLabel$;

  dyfChartApex$ = this.taskDetailsService.dyfDataApex$;
  dyfChartLegend: string[] = [];

  whatWasWrongChartLegend: string[] = [];
  whatWasWrongChartApex$ = this.taskDetailsService.whatWasWrongDataApex$;

  ngOnInit() {
    combineLatest([
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
      this.currentLang$,
    ]).subscribe(([dateRange, comparisonDateRange, lang]) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';

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

      this.visitsByPageCols = [
        {
          field: 'url',
          header: this.i18n.service.translate('URL', lang),
          type: 'link',
          typeParams: { preLink: `/${this.langLink}/pages`, link: '_id' },
        },
        {
          field: 'dyfYes',
          header: this.i18n.service.translate('yes', lang),
          pipe: 'number',
        },
        {
          field: 'dyfNo',
          header: this.i18n.service.translate('no', lang),
          pipe: 'number',
        },
        {
          field: 'percentChange',
          header: this.i18n.service.translate('comparison-for-No-answer', lang),
          pipe: 'percent',
        },
        {
          field: 'feedbackToVisitsRatio',
          header: this.i18n.service.translate(
            'Ratio of feedback to visits',
            lang,
          ),
          pipe: 'percent',
          pipeParam: '1.2',
        },
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

      this.feedbackCommentsCols = [
        { field: 'url', header: this.i18n.service.translate('URL', lang) },
        {
          field: 'date',
          header: this.i18n.service.translate('date', lang),
          pipe: 'date',
        },
        {
          field: 'comment',
          header: this.i18n.service.translate('comment', lang),
        },
      ];
    });
  }
}
