import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import { GetTableProps } from '@dua-upd/utils-common';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

type VisitsByPageColType = GetTableProps<
  ProjectDetailsFeedbackComponent,
  'visitsByPage$'
>;
type DyfTableColTypes = GetTableProps<
  ProjectDetailsFeedbackComponent,
  'dyfChart$'
>;
type WhatWasWrongColTypes = GetTableProps<
  ProjectDetailsFeedbackComponent,
  'whatWasWrongChart$'
>;
type FeedbackCommentsColType = GetTableProps<
  ProjectDetailsFeedbackComponent,
  'feedbackComments$'
>;
type FeedbackByTagsColTypes = GetTableProps<
  ProjectDetailsFeedbackComponent,
  'feedbackByTagsTable$'
>;

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

  dyfChartApex$ = this.projectsDetailsService.dyfDataApex$;
  dyfChartLegend: string[] = [];

  whatWasWrongChartLegend: string[] = [];
  whatWasWrongChartApex$ = this.projectsDetailsService.whatWasWrongDataApex$;

  feedbackByTagsBarChartData$ =
    this.projectsDetailsService.feedbackByTagsBarChart$;
  apexFeedbackByTagsChart$ =
    this.projectsDetailsService.apexFeedbackByTagsTable$;

  feedbackComments$ = this.projectsDetailsService.feedbackComments$;
  feedbackCommentsCols: ColumnConfig<FeedbackCommentsColType>[] = [];

  feedbackByTagsTable$ = this.projectsDetailsService.feedbackByTagsTable$;
  feedbackByTagsTableCols: ColumnConfig<FeedbackByTagsColTypes>[] = [];

  dateRangeLabel$ = this.projectsDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ =
    this.projectsDetailsService.comparisonDateRangeLabel$;

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
          header: this.i18n.service.translate('no', lang),
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
          header: this.i18n.service.translate('comparison-for-No-answer', lang),
          pipe: 'percent',
        },
        {
          field: 'feedbackToVisitsRatio',
          header: this.i18n.service.translate(
            'Ratio of feedback to visits',
            lang
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
