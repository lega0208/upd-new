import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@dua-upd/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';
import { EN_CA, LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { combineLatest } from 'rxjs';
import { GetTableProps } from '@dua-upd/utils-common';

type DocumentsColTypes = GetTableProps<
  ProjectDetailsUxTestsComponent,
  'documents$'
  >;

@Component({
  selector: 'upd-project-details-ux-tests',
  templateUrl: './project-details-ux-tests.component.html',
  styleUrls: ['./project-details-ux-tests.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsUxTestsComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';
  baseline = '';

  lineChart = lineChart;

  bubbleChart$ = this.projectsDetailsService.bubbleChart$;
  lineTaskChart$ = this.projectsDetailsService.lineTaskChart$;

  avgTaskSuccessFromLastTest$ =
    this.projectsDetailsService.avgTaskSuccessFromLastTest$;
  avgSuccessPercentChange$ =
    this.projectsDetailsService.avgSuccessPercentChange$;
  dateFromLastTest$ = this.projectsDetailsService.dateFromLastTest$;
  projectTasks$ = this.projectsDetailsService.projectTasks$;
  taskSuccessByUxTest$ = this.projectsDetailsService.taskSuccessByUxTest$;
  taskSuccessByUxTestKpi$ = this.projectsDetailsService.taskSuccessByUxTestKpi$;
  totalParticipants$ = this.projectsDetailsService.totalParticipants$;

  documents$ = this.projectsDetailsService.documents$;
  documentsCols: ColumnConfig<DocumentsColTypes>[] = [];

  constructor(
    private readonly projectsDetailsService: ProjectsDetailsFacade,
    private i18n: I18nFacade,
  ) {}

  participantTasksCols: ColumnConfig[] = [];
  taskSuccessRateCols: ColumnConfig[] = [];
  successRateCols: ColumnConfig[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([this.currentLang$, this.taskSuccessByUxTestKpi$]).subscribe(
      ([lang, kpiData]) => {
        this.documentsCols = [
          {
            field: 'filename',
            header: this.i18n.service.translate('Documents', lang),
            type: 'link',
            typeParams: { link: 'url', external: true },
          },
        ];

        this.langLink = lang === EN_CA ? 'en' : 'fr';
        this.participantTasksCols = [
          {
            field: 'title',
            header: this.i18n.service.translate('Task list', lang),
            type: 'link',
            typeParams: { preLink: `/${this.langLink}/tasks`, link: '_id' },
          },
        ];
        this.taskSuccessRateCols = [
          {
            field: 'tasks',
            header: this.i18n.service.translate('Task list', lang),
          },
          {
            field: 'test_type',
            header: this.i18n.service.translate('test-type', lang),
          },
          {
            field: 'date',
            header: this.i18n.service.translate('date', lang),
          },
          {
            field: 'success_rate',
            header: this.i18n.service.translate('success-rate', lang),
            pipe: 'percent',
          },
        ];

        this.successRateCols = [
          { field: 'task', header: this.i18n.service.translate('task', lang) },
        ];
        if (kpiData.some((d) => d.Baseline >= 0)) {
          this.successRateCols.push({
            field: 'Baseline',
            header: this.i18n.service.translate('Baseline', lang),
            pipe: 'percent',
          });
        }
        if (kpiData.some((d) => d.Exploratory >= 0)) {
          this.successRateCols.push({
            field: 'Exploratory',
            header: this.i18n.service.translate('Exploratory', lang),
            pipe: 'percent',
          });
        }
        if (kpiData.some((d) => d['Spot Check'] >= 0)) {
          this.successRateCols.push({
            field: 'Spot Check',
            header: this.i18n.service.translate('Spot Check', lang),
            pipe: 'percent',
          });
        }
        if (kpiData.some((d) => d.Validation >= 0)) {
          this.successRateCols.push({
            field: 'Validation',
            header: this.i18n.service.translate('Validation', lang),
            pipe: 'percent',
          });
        }
        if (kpiData.some((d) => d.change >= 0)) {
          this.successRateCols.push({
            field: 'change',
            header: this.i18n.service.translate('comparison', lang),
            pipe: 'percent',
          });
        }
      }
    );
  }
}

const lineChart = [
  {
    name: 'Finding Child Tax Benefit (CCB) Amount	',
    series: [
      {
        name: 'Baseline',
        value: 0.25,
      },
    ],
  },
  {
    name: 'Change banking information (MyAccount)',
    series: [
      {
        name: 'Baseline',
        value: 0.5,
      },
    ],
  },
];
