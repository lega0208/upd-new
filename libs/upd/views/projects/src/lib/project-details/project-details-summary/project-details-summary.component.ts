import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ColumnConfig, callVolumeObjectiveCriteria } from '@dua-upd/upd-components';
import { LocaleId, EN_CA } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { GetTableProps } from '@dua-upd/utils-common';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

type ParticipantTasksColTypes = GetTableProps<
  ProjectDetailsSummaryComponent,
  'participantTasks$'
>;
type DyfTableColTypes = GetTableProps<
  ProjectDetailsSummaryComponent,
  'dyfChart$'
>;
type WhatWasWrongColTypes = GetTableProps<
  ProjectDetailsSummaryComponent,
  'whatWasWrongChart$'
>;

@Component({
  selector: 'upd-project-details-summary',
  templateUrl: './project-details-summary.component.html',
  styleUrls: ['./project-details-summary.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsSummaryComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

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

  totalCalldriver$ = this.projectsDetailsService.totalCalldriver$;
  totalCalldriverPercentChange$ =
    this.projectsDetailsService.totalCalldriverPercentChange$;

  callVolumeObjectiveCriteria = callVolumeObjectiveCriteria;
  callVolumeKpiConfig = {
    pass: { message: 'kpi-met-volume' },
    fail: { message: 'kpi-not-met-volume' },
  };

  constructor(
    private readonly projectsDetailsService: ProjectsDetailsFacade,
    private i18n: I18nFacade
  ) {}

  participantTasksCols: ColumnConfig<ParticipantTasksColTypes>[] = [];
  dyfTableCols: ColumnConfig<DyfTableColTypes>[] = [];
  whatWasWrongTableCols: ColumnConfig<WhatWasWrongColTypes>[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    this.currentLang$.subscribe((lang) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';
      this.participantTasksCols = [
        {
          field: 'title',
          header: this.i18n.service.translate('Task list', lang),
          type: 'link',
          typeParams: { preLink: '/' + this.langLink + '/tasks', link: '_id' },
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
    });
  }
}
