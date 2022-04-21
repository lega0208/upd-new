import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-summary',
  templateUrl: './project-details-summary.component.html',
  styleUrls: ['./project-details-summary.component.css'],
})
export class ProjectDetailsSummaryComponent implements OnInit {
  avgTaskSuccessFromLastTest$ =
    this.projectsDetailsService.avgTaskSuccessFromLastTest$;
  dateFromLastTest$ = this.projectsDetailsService.dateFromLastTest$;

  visits$ = this.projectsDetailsService.visits$;

  taskSuccessByUxTest$ =
    this.projectsDetailsService.taskSuccessByUxTestDefault$;
  taskSuccessByUxTestCols: ColumnConfig[] = [];

  dyfChart$ = this.projectsDetailsService.dyfData$;
  whatWasWrongChart$ = this.projectsDetailsService.whatWasWrongData$;

  dyfTableCols: ColumnConfig[] = [];
  whatWasWrongTableCols: ColumnConfig[] = [];

  currentLang$ = this.i18n.currentLang$;
  currentLang!: LocaleId;

  visitsByPageCols: ColumnConfig[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.dyfTableCols = [
        { field: 'name', header: 'Selection' },
        { field: 'value', header: 'Visits', pipe: 'number' },
      ];
      this.whatWasWrongTableCols = [
        { field: 'name', header: 'What was wrong' },
        { field: 'value', header: 'Visits', pipe: 'number' },
      ];
      this.taskSuccessByUxTestCols = [
        {
          field: 'title',
          header: 'Task list',
          type: 'link',
          typeParams: { preLink: '/tasks', link: 'tasks' },
        },
      ];
    });
  }

  constructor(
    private readonly projectsDetailsService: ProjectsDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
