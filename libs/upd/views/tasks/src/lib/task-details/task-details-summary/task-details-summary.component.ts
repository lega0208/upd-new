import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ColumnConfig, callVolumeObjectiveCriteria } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'upd-task-details-summary',
  templateUrl: './task-details-summary.component.html',
  styleUrls: ['./task-details-summary.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsSummaryComponent implements OnInit {
  avgTaskSuccessFromLastTest$ = this.taskDetailsService.avgTaskSuccessFromLastTest$;
  dateFromLastTest$ = this.taskDetailsService.dateFromLastTest$;

  visits$ = this.taskDetailsService.visits$;
  visitsPercentChange$ = this.taskDetailsService.visitsPercentChange$;

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

  avgTaskSuccessKpiCriteria = (successRate: number) => successRate >= 0.8 ? 'pass' : 'fail';

  ngOnInit(): void {
    this.currentLang$.subscribe((lang) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';

      this.visitsByPageCols = [
        {
          field: 'title',
          header: this.i18n.service.translate('page-title', lang),
          type: 'link',
          typeParams: { preLink: '/' + this.langLink + '/pages', link: '_id' },
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
        },
        { field: 'date', header: this.i18n.service.translate('date', lang), pipe: 'date' },
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
        { field: 'name', header: this.i18n.service.translate('d3-www', lang) },
        {
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
      ];
    });
  }

  constructor(private readonly taskDetailsService: TasksDetailsFacade, private i18n: I18nFacade) {}
}
