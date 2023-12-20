import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  type ColumnConfig,
  callVolumeObjectiveCriteria,
  feedbackKpiObjectiveCriteria,
} from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';
import { createCategoryConfig } from '@dua-upd/upd/utils';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'upd-task-details-summary',
  templateUrl: './task-details-summary.component.html',
  styleUrls: ['./task-details-summary.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsSummaryComponent implements OnInit {
  private i18n = inject(I18nFacade);
  private readonly taskDetailsService = inject(TasksDetailsFacade);

  avgTaskSuccessFromLastTest$ =
    this.taskDetailsService.avgTaskSuccessFromLastTest$;
  avgSuccessPercentChange$ = this.taskDetailsService.avgSuccessPercentChange$;
  dateFromLastTest$ = this.taskDetailsService.dateFromLastTest$;

  visits$ = this.taskDetailsService.visits$;
  visitsPercentChange$ = this.taskDetailsService.visitsPercentChange$;

  feedbackKpiObjectiveCriteria = feedbackKpiObjectiveCriteria;

  apexCallDrivers$ = this.taskDetailsService.apexCallDrivers$;
  apexKpiFeedback$ = this.taskDetailsService.apexKpiFeedback$;

  callPerVisits$ = this.taskDetailsService.callPerVisits$;
  apexCallPercentChange$ = this.taskDetailsService.apexCallPercentChange$;
  apexCallDifference$ = this.taskDetailsService.apexCallDifference$;

  currentKpiFeedback$ = this.taskDetailsService.currentKpiFeedback$;
  kpiFeedbackPercentChange$ = this.taskDetailsService.kpiFeedbackPercentChange$;
  kpiFeedbackDifference$ = this.taskDetailsService.kpiFeedbackDifference$;

  currentCallVolume$ = this.taskDetailsService.currentCallVolume$;
  callPercentChange$ = this.taskDetailsService.callPercentChange$;

  visitsByPage$ = this.taskDetailsService.visitsByPageWithPercentChange$;

  dyfChart$ = this.taskDetailsService.dyfData$;
  whatWasWrongChart$ = this.taskDetailsService.whatWasWrongData$;

  taskSuccessByUxTest$ = this.taskDetailsService.taskSuccessByUxTest$;
  taskSuccessByUxTestCols: ColumnConfig[] = [];

  callVolumeObjectiveCriteria = callVolumeObjectiveCriteria;
  callVolumeKpiConfig = {
    pass: { message: 'kpi-met-volume' },
    fail: { message: 'kpi-not-met-volume' },
  };

  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  visitsByPageCols: ColumnConfig[] = [];
  dyfTableCols: ColumnConfig[] = [];
  whatWasWrongTableCols: ColumnConfig[] = [];

  dyfChartApex$ = this.taskDetailsService.dyfDataApex$;
  dyfChartLegend: string[] = [];

  whatWasWrongChartLegend: string[] = [];
  whatWasWrongChartApex$ = this.taskDetailsService.whatWasWrongDataApex$;

  avgTaskSuccessKpiCriteria = (successRate: number) =>
    successRate >= 0.8 ? 'pass' : 'fail';

  ngOnInit(): void {
    combineLatest([this.visitsByPage$, this.currentLang$]).subscribe(
      ([data, lang]) => {
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
            field: 'title',
            header: this.i18n.service.translate('page-title', lang),
            type: 'link',
            typeParams: {
              preLink: '/' + this.langLink + '/pages',
              link: '_id',
            },
          },
          {
            field: 'language',
            header: this.i18n.service.translate('Search term language', lang),
            filterConfig: {
              type: 'category',
              categories: createCategoryConfig({
                i18n: this.i18n.service,
                data,
                field: 'language',
              }),
            },
          },
          {
            field: 'url',
            header: this.i18n.service.translate('URL', lang),
            type: 'link',
            typeParams: { link: 'url', external: true },
          },
          {
            field: 'visits',
            header: this.i18n.service.translate('visits', lang),
            pipe: 'number',
          },
          {
            field: 'percentChange',
            header: this.i18n.service.translate('%-change', lang),
            pipe: 'percent',
            type: 'comparison',
          },
        ];

        this.taskSuccessByUxTestCols = [
          {
            field: 'title',
            header: this.i18n.service.translate('ux-test', lang),
            type: 'link',
            typeParams: {
              preLink: '/' + this.langLink + '/projects',
              link: '_project_id',
            },
          },
          {
            field: 'date',
            header: this.i18n.service.translate('date', lang),
            pipe: 'date',
          },
          {
            field: 'test_type',
            header: this.i18n.service.translate('test-type', lang),
          },
          {
            field: 'success_rate',
            header: this.i18n.service.translate('success-rate', lang),
            pipe: 'percent',
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
          {
            field: 'name',
            header: this.i18n.service.translate('d3-www', lang),
          },
          {
            field: 'value',
            header: this.i18n.service.translate('visits', lang),
            pipe: 'number',
          },
        ];
      },
    );
  }
}
