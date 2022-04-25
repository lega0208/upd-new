import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';
import { EN_CA } from '@cra-arc/upd/i18n';

@Component({
  selector: 'app-project-details-summary',
  templateUrl: './project-details-summary.component.html',
  styleUrls: ['./project-details-summary.component.css'],
})
export class ProjectDetailsSummaryComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  avgTaskSuccessFromLastTest$ =
    this.projectsDetailsService.avgTaskSuccessFromLastTest$;
  dateFromLastTest$ = this.projectsDetailsService.dateFromLastTest$;

  visits$ = this.projectsDetailsService.visits$;

  participantTasks$ = this.projectsDetailsService.taskSuccessByUxTestDefault$;


  dyfChart$ = this.projectsDetailsService.dyfData$;
  whatWasWrongChart$ = this.projectsDetailsService.whatWasWrongData$;

  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade, private i18n: I18nFacade) {}

  participantTasksCols: ColumnConfig[] = [];
  dyfTableCols: ColumnConfig[] = [];
  whatWasWrongTableCols: ColumnConfig[] = [];

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
          typeParams: { preLink: '/' + this.langLink + '/tasks', link: 'tasks' },
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
