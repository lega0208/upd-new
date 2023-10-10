import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  difference,
  filter,
  flatten,
  intersection,
  keys,
  map,
  pipe,
  piped,
  uniq,
} from 'rambdax';
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

  apexTaskSuccessByUxTest$ =
    this.projectsDetailsService.apexTaskSuccessByUxTest$;

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
    private i18n: I18nFacade
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
            header: this.i18n.service.translate('File link', lang),
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

        const testTypesWithSuccessRate = piped(
          kpiData,
          map(
            pipe(
              filter(
                (val: number | boolean | string, key: string) =>
                  !['isChange', 'task'].includes(key) && !isNaN(val as number)
              ),
              keys
            )
          ),
          (keys) => flatten<string>(keys),
          uniq
        );

        if (!testTypesWithSuccessRate.length) {
          return;
        }

        const startCols = [
          {
            field: 'task',
            header: this.i18n.service.translate('task', lang),
          } as ColumnConfig,
        ];

        if (testTypesWithSuccessRate.includes('Baseline')) {
          startCols.push({
            field: 'Baseline',
            header: this.i18n.service.translate('Baseline', lang),
            pipe: 'percent',
          });
        }

        const middleCols = piped(
          testTypesWithSuccessRate,
          (testTypes) =>
            difference(testTypes, ['Baseline', 'Validation', 'change']),
          map((key: string) => ({
            field: key,
            header: this.i18n.service.translate(key, lang),
            pipe: 'percent',
          }))
        );

        const endCols = piped(
          testTypesWithSuccessRate,
          (testTypes) => intersection(testTypes, ['Validation', 'change']),
          map((key) => ({
            field: key,
            header: this.i18n.service.translate(key, lang),
            pipe: 'percent',
          }))
        );

        this.successRateCols = flatten([startCols, middleCols, endCols]);
      }
    );
  }
}
