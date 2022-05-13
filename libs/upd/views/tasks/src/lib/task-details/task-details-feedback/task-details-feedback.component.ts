import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';
import { EN_CA } from '@cra-arc/upd/i18n';
import { GetTableProps } from '@cra-arc/utils-common';
import { combineLatest } from 'rxjs';

type FeedbackCommentsColType = GetTableProps<TaskDetailsFeedbackComponent, 'feedbackComments$'>
type FeedbackByTagsColTypes = GetTableProps<TaskDetailsFeedbackComponent, 'feedbackByTagsTable$'>

@Component({
  selector: 'app-task-details-feedback',
  templateUrl: './task-details-feedback.component.html',
  styleUrls: ['./task-details-feedback.component.css'],
})
export class TaskDetailsFeedbackComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  visitsByPage$ =
    this.taskDetailsService.visitsByPageFeedbackWithPercentChange$;
  visitsByPageCols: ColumnConfig[] = [];

  dyfChart$ = this.taskDetailsService.dyfData$;
  whatWasWrongChart$ = this.taskDetailsService.whatWasWrongData$;

  dyfTableCols: ColumnConfig[] = [];
  whatWasWrongTableCols: ColumnConfig[] = [];

  feedbackByTagsBarChartData$ = this.taskDetailsService.feedbackByTagsBarChart$;

  feedbackComments$ = this.taskDetailsService.feedbackComments$;
  feedbackCommentsCols: ColumnConfig<FeedbackCommentsColType>[] = [];

  feedbackByTagsTable$ = this.taskDetailsService.feedbackByTagsTable$;
  feedbackByTagsTableCols: ColumnConfig<FeedbackByTagsColTypes>[] = [];

  dateRangeLabel$ = this.taskDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.taskDetailsService.comparisonDateRangeLabel$;

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
      this.currentLang$,
    ]).subscribe(([dateRange, comparisonDateRange, lang]) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';

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
          header: this.i18n.service.translate('No', lang),
          pipe: 'number',
        },
        // {
        //   field: '0',
        //   header: this.i18n.service.translate('comparison-for-No-answer', lang),
        //   pipe: 'percent',
        // },
        // {
        //   field: '0',
        //   header: this.i18n.service.translate(
        //     '% of visitors who left feedback',
        //     lang
        //   ),
        //   pipe: 'percent',
        // },
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
        { field: 'url', header: this.i18n.service.translate('URL', lang) },
        { field: 'date', header: this.i18n.service.translate('date', lang) },
        { field: 'tag', header: this.i18n.service.translate('tags', lang) },
        { field: 'whats_wrong', header: this.i18n.service.translate('d3-www', lang) },
        { field: 'comment', header: this.i18n.service.translate('comment', lang) },
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

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
