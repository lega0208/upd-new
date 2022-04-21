import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-project-details-summary',
  templateUrl: './project-details-summary.component.html',
  styleUrls: ['./project-details-summary.component.css'],
})
export class ProjectDetailsSummaryComponent {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  avgTaskSuccessFromLastTest$ =
    this.projectsDetailsService.avgTaskSuccessFromLastTest$;

  visits$ = this.projectsDetailsService.visits$;

  participantTasks$ = this.projectsDetailsService.taskSuccessByUxTestDefault$;
  // participantTasksCols = [
  //   {
  //     field: 'title',
  //     header: 'Task list',
  //     type: 'link',
  //     typeParams: { preLink: '/tasks', link: 'tasks' },
  //   }
  // ] as ColumnConfig[];

  dyfChart$ = this.projectsDetailsService.dyfData$;
  whatWasWrongChart$ = this.projectsDetailsService.whatWasWrongData$;

  // dyfTableCols: ColumnConfig[] = [
  //   { field: 'name', header: 'Selection' },
  //   { field: 'value', header: 'Visits', pipe: 'number' },
  // ];
  // whatWasWrongTableCols: ColumnConfig[] = [
  //   { field: 'name', header: 'What was wrong' },
  //   { field: 'value', header: 'Visits', pipe: 'number' },
  // ];

  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade, private i18n: I18nFacade) {}

  participantTasksCols: ColumnConfig[] = [];
  dyfTableCols: ColumnConfig[] = [];
  whatWasWrongTableCols: ColumnConfig[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.participantTasksCols = [
        {
          field: 'title',
          header: this.i18n.service.translate('Task list', lang),
          type: 'link',
          typeParams: { preLink: '/tasks', link: 'tasks' },
        }
      ];
      this.dyfTableCols = [
        { field: 'name', header: this.i18n.service.translate('Selection', lang) },
        { field: 'value', header: this.i18n.service.translate('visits', lang), pipe: 'number' }
      ];
      this.whatWasWrongTableCols = [
        { field: 'name', header: this.i18n.service.translate('d3-www', lang) },
        { field: 'value', header: this.i18n.service.translate('visits', lang), pipe: 'number' }
      ];
    });
  }
}
