import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-project-details-ux-tests',
  templateUrl: './project-details-ux-tests.component.html',
  styleUrls: ['./project-details-ux-tests.component.css'],
})
export class ProjectDetailsUxTestsComponent {
  bubbleChart$ = this.projectsDetailsService.bubbleChart$;

  avgTaskSuccessFromLastTest$ =
    this.projectsDetailsService.avgTaskSuccessFromLastTest$;
  dateFromLastTest$ = this.projectsDetailsService.dateFromLastTest$;
  taskSuccessByUxTest$ = this.projectsDetailsService.taskSuccessByUxTest$;
  totalParticipants$ = this.projectsDetailsService.totalParticipants$;

  participantTasks$ = this.projectsDetailsService.taskSuccessByUxTestDefault$;
  participantTasksCols = [
    {
      field: 'title',
      header: 'Task list',
      type: 'link',
      typeParams: { preLink: '/tasks', link: 'tasks' },
    },
  ] as ColumnConfig[];

  taskSuccessRateCols = [
    {
      field: 'title',
      header: 'Task',
    },
    {
      field: 'testType',
      header: 'Test type',
    },
    {
      field: 'successRate',
      header: 'Success rate',
      pipe: 'percent',
    },
  ] as ColumnConfig[];

  uxTests$ = [
    {
      name: 'SPR Baseline 3',
      value: 0.88,
    },
  ];

  successRate$ = [
    {
      title: 'SPR Baseline 3',
      scenario: 'Lorem ipsum',
      result: 0.88,
      date: 2021 - 10 - 27,
      participants: 8,
    },
  ];

  // successRateCols = [
  //   { field: 'title', header: 'Task' },
  //   { field: 'result', header: 'Baseline', pipe: 'percent' },
  // ] as ColumnConfig[];

  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade, private i18n: I18nFacade) {}

  participantTasksCols: ColumnConfig[] = [];
  taskSuccessRateCols: ColumnConfig[] = [];
  successRateCols: ColumnConfig[] = [];

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
      this.taskSuccessRateCols = [
        {
          field: 'title',
          header: this.i18n.service.translate('Task list', lang)
        },
        {
          field: 'testType',
          header: this.i18n.service.translate('test-type', lang)
        },
        {
          field: 'successRate',
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
