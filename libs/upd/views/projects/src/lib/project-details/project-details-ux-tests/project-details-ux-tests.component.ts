import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';
import { EN_CA } from '@cra-arc/upd/i18n';

@Component({
  selector: 'app-project-details-ux-tests',
  templateUrl: './project-details-ux-tests.component.html',
  styleUrls: ['./project-details-ux-tests.component.css'],
})
export class ProjectDetailsUxTestsComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  bubbleChart$ = this.projectsDetailsService.bubbleChart$;

  avgTaskSuccessFromLastTest$ =
    this.projectsDetailsService.avgTaskSuccessFromLastTest$;
  dateFromLastTest$ = this.projectsDetailsService.dateFromLastTest$;
  projectTasks$ = this.projectsDetailsService.projectTasks$;
  taskSuccessByUxTest$ = this.projectsDetailsService.taskSuccessByUxTest$;
  totalParticipants$ = this.projectsDetailsService.totalParticipants$;

  // participantTasksCols = [
  //   {
  //     field: 'title',
  //     header: 'Task list',
  //     type: 'link',
  //     typeParams: { preLink: '/tasks', link: 'tasks' },
  //   },
  // ] as ColumnConfig[];

  // taskSuccessRateCols = [
  //   {
  //     field: 'title',
  //     header: 'Task',
  //   },
  //   {
  //     field: 'testType',
  //     header: 'Test type',
  //   },
  //   {
  //     field: 'successRate',
  //     header: 'Success rate',
  //     pipe: 'percent',
  //   },
  // ] as ColumnConfig[];

  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade, private i18n: I18nFacade) {}

  participantTasksCols: ColumnConfig[] = [];
  taskSuccessRateCols: ColumnConfig[] = [];
  successRateCols: ColumnConfig[] = [];

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
          typeParams: { preLink: `/${this.langLink}/tasks`, link: '_id' },
        }
      ];
      this.taskSuccessRateCols = [
        {
          field: 'tasks',
          header: this.i18n.service.translate('Task list', lang)
        },
        {
          field: 'test_type',
          header: this.i18n.service.translate('test-type', lang)
        },
        {
          field: 'success_rate',
          header: this.i18n.service.translate('success-rate', lang),
          pipe: 'percent',
        }
      ];
      this.successRateCols = [
        { field: 'title', header: this.i18n.service.translate('Task', lang) },
        { field: 'result', header: this.i18n.service.translate('Baseline', lang), pipe: 'percent' },
      ];
    });
  }
}
