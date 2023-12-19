import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { combineLatest } from 'rxjs';
import {
  type ColumnConfig,
  callVolumeObjectiveCriteria,
  feedbackKpiObjectiveCriteria,
} from '@dua-upd/upd-components';
import { EN_CA } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import type { GetTableProps } from '@dua-upd/utils-common';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

type ParticipantTasksColTypes = GetTableProps<
  ProjectDetailsSummaryComponent,
  'participantTasks$'
>;
// type DyfTableColTypes = GetTableProps<
//   ProjectDetailsSummaryComponent,
//   'dyfChart$'
// >;
type WhatWasWrongColTypes = GetTableProps<
  ProjectDetailsSummaryComponent,
  'whatWasWrongChart$'
>;

type DocumentsColTypes = GetTableProps<
  ProjectDetailsSummaryComponent,
  'documents$'
>;

@Component({
  selector: 'upd-project-details-summary',
  templateUrl: './project-details-summary.component.html',
  styleUrls: ['./project-details-summary.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsSummaryComponent implements OnInit {
  private i18n = inject(I18nFacade);
  private readonly projectsDetailsService = inject(ProjectsDetailsFacade);

  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  fullDateRangeLabel$ = this.projectsDetailsService.fullDateRangeLabel$;
  fullComparisonDateRangeLabel$ =
    this.projectsDetailsService.fullComparisonDateRangeLabel$;

  feedbackKpiObjectiveCriteria = feedbackKpiObjectiveCriteria;

  apexCallDrivers$ = this.projectsDetailsService.apexCallDrivers$;
  apexKpiFeedback$ = this.projectsDetailsService.apexKpiFeedback$;

  documents$ = this.projectsDetailsService.documents$;
  documentsCols: ColumnConfig<DocumentsColTypes>[] = [];

  callPerVisits$ = this.projectsDetailsService.callPerVisits$;
  apexCallPercentChange$ = this.projectsDetailsService.apexCallPercentChange$;
  apexCallDifference$ = this.projectsDetailsService.apexCallDifference$;

  currentKpiFeedback$ = this.projectsDetailsService.currentKpiFeedback$;
  kpiFeedbackPercentChange$ =
    this.projectsDetailsService.kpiFeedbackPercentChange$;
  kpiFeedbackDifference$ = this.projectsDetailsService.kpiFeedbackDifference$;

  avgTaskSuccessFromLastTest$ =
    this.projectsDetailsService.avgTaskSuccessFromLastTest$;
  avgSuccessPercentChange$ =
    this.projectsDetailsService.avgSuccessPercentChange$;
  dateFromLastTest$ = this.projectsDetailsService.dateFromLastTest$;
  taskSuccessByUxTest$ = this.projectsDetailsService.taskSuccessByUxTest$;

  visits$ = this.projectsDetailsService.visits$;
  visitsPercentChange$ = this.projectsDetailsService.visitsPercentChange$;

  participantTasks$ = this.projectsDetailsService.projectTasks$;

  dyfChart$ = this.projectsDetailsService.dyfData$;
  whatWasWrongChart$ = this.projectsDetailsService.whatWasWrongData$;

  dyfChartApex$ = this.projectsDetailsService.dyfDataApex$;
  dyfChartLegend: string[] = [];

  whatWasWrongChartLegend: string[] = [];
  whatWasWrongChartApex$ = this.projectsDetailsService.whatWasWrongDataApex$;

  totalCalldriver$ = this.projectsDetailsService.totalCalldriver$;
  totalCalldriverPercentChange$ =
    this.projectsDetailsService.totalCalldriverPercentChange$;

  callVolumeObjectiveCriteria = callVolumeObjectiveCriteria;
  callVolumeKpiConfig = {
    pass: { message: 'kpi-met-volume' },
    fail: { message: 'kpi-not-met-volume' },
  };

  memberList$ = this.projectsDetailsService.members$;
  memberListCols: ColumnConfig[] = [];

  description$ = this.projectsDetailsService.description$;

  startDate$ = this.projectsDetailsService.startDate$;
  launchDate$ = this.projectsDetailsService.launchDate$;

  participantTasksCols: ColumnConfig<ParticipantTasksColTypes>[] = [];
  dyfTableCols: ColumnConfig<{ name: string; currValue: number; prevValue: string }>[] = [];
  whatWasWrongTableCols: ColumnConfig<WhatWasWrongColTypes>[] = [];

  dateRangeLabel$ = this.projectsDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ =
    this.projectsDetailsService.comparisonDateRangeLabel$;

  ngOnInit() {
    combineLatest([
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
      this.currentLang$,
    ]).subscribe(([dateRange, comparisonDateRange, lang]) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';


      this.documentsCols = [
        {
          field: 'filename',
          header: this.i18n.service.translate('File link', lang),
          type: 'link',
          typeParams: { link: 'url', external: true },
        },
      ];

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

      this.participantTasksCols = [
        {
          field: 'title',
          header: this.i18n.service.translate('Task list', lang),
          type: 'link',
          typeParams: { preLink: '/' + this.langLink + '/tasks', link: '_id' },
        },
        // {
        //   field: 'calls',
        //   header: this.i18n.service.translate('Calls / 100 Visits', lang),
        //   pipe: 'number',
        // },
        // {
        //   field: 'dyfNo',
        //   header: this.i18n.service.translate(
        //     '"No clicks" / 1,000 Visits',
        //     lang
        //   ),
        //   pipe: 'number',
        // },
        // {
        //   field: 'uxTest2Years',
        //   header: this.i18n.service.translate('UX Test in Past 2 Years?', lang),
        // },
        // {
        //   field: 'successRate',
        //   header: this.i18n.service.translate(
        //     'Latest UX Task Success Rate',
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

      this.memberListCols = [
        {
          field: 'name',
          header: this.i18n.service.translate('Name', lang),
        },
        {
          field: 'role',
          header: this.i18n.service.translate('Role', lang),
        },
      ];
    });
  }
}
