import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import { GetTableProps } from '@dua-upd/utils-common';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';


type VisitsByPageColType = GetTableProps<ProjectDetailsFeedbackComponent, 'visitsByPage$'>
type DyfTableColTypes = GetTableProps<ProjectDetailsFeedbackComponent, 'dyfChart$'>
type WhatWasWrongColTypes = GetTableProps<ProjectDetailsFeedbackComponent, 'whatWasWrongChart$'>
type FeedbackCommentsColType = GetTableProps<ProjectDetailsFeedbackComponent, 'feedbackComments$'>
type FeedbackByTagsColTypes = GetTableProps<ProjectDetailsFeedbackComponent, 'feedbackByTagsTable$'>

@Component({
  selector: 'upd-project-details-feedback',
  templateUrl: './project-details-feedback.component.html',
  styleUrls: ['./project-details-feedback.component.css'],
})
export class ProjectDetailsFeedbackComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  visitsByPage$ =
    this.projectsDetailsService.visitsByPageFeedbackWithPercentChange$;
  visitsByPageCols: ColumnConfig<VisitsByPageColType>[] = [];

  dyfChart$ = this.projectsDetailsService.dyfData$;
  whatWasWrongChart$ = this.projectsDetailsService.whatWasWrongData$;

  dyfTableCols: ColumnConfig<DyfTableColTypes>[] = [];
  whatWasWrongTableCols: ColumnConfig<WhatWasWrongColTypes>[] = [];

  feedbackByTagsBarChartData$ = this.projectsDetailsService.feedbackByTagsBarChart$;

  feedbackComments$ = this.projectsDetailsService.feedbackComments$;
  feedbackCommentsCols: ColumnConfig<FeedbackCommentsColType>[] = [];

  feedbackByTagsTable$ = this.projectsDetailsService.feedbackByTagsTable$;
  feedbackByTagsTableCols: ColumnConfig<FeedbackByTagsColTypes>[] = [];

  dateRangeLabel$ = this.projectsDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.projectsDetailsService.comparisonDateRangeLabel$;

  constructor(
    private readonly projectsDetailsService: ProjectsDetailsFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
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
          typeParams: { preLink: '/' + this.langLink + '/pages', link: '_id' },
        },
        {
          field: 'dyfYes',
          header: this.i18n.service.translate('yes', lang),
          pipe: 'number',
          type: 'link',
          typeParams: {
            preLink: '/' + this.langLink + '/pages',
            link: '_id',
            postLink: 'pagefeedback',
          },
        },
        {
          field: 'dyfNo',
          header: this.i18n.service.translate('No', lang),
          pipe: 'number',
          type: 'link',
          typeParams: {
            preLink: '/' + this.langLink + '/pages',
            link: '_id',
            postLink: 'pagefeedback',
          },
        },
        // {
        //   field: 'percentChange',
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
        { field: 'date', header: this.i18n.service.translate('date', lang), pipe: 'date' },
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
}
