import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';
import { EN_CA } from '@cra-arc/upd/i18n';

@Component({
  selector: 'app-task-details-summary',
  templateUrl: './task-details-summary.component.html',
  styleUrls: ['./task-details-summary.component.css'],
})
export class TaskDetailsSummaryComponent implements OnInit {
  avgTaskSuccessFromLastTest$ =
    this.taskDetailsService.avgTaskSuccessFromLastTest$;
  dateFromLastTest$ = this.taskDetailsService.dateFromLastTest$;

  visits$ = this.taskDetailsService.visits$;
  visitsPercentChange$ = this.taskDetailsService.visitsPercentChange$;

  visitsByPage$ = this.taskDetailsService.visitsByPageWithPercentChange$;

  dyfChart$ = this.taskDetailsService.dyfData$;
  whatWasWrongChart$ = this.taskDetailsService.whatWasWrongData$;

  taskSuccessByUxTest$ = this.taskDetailsService.taskSuccessByUxTest$;
  taskSuccessByUxTestCols: ColumnConfig[] = [];

  // dyfTableCols: ColumnConfig[] = [
  //   { field: 'name', header: 'Selection' },
  //   { field: 'value', header: 'Visits', pipe: 'number' },
  // ];
  // whatWasWrongTableCols: ColumnConfig[] = [
  //   { field: 'name', header: 'What was wrong' },
  //   { field: 'value', header: 'Visits', pipe: 'number' },
  // ];

  currentLang$ = this.i18n.currentLang$;
  currentLang!: LocaleId;
  langLink = 'en';

  visitsByPageCols: ColumnConfig[] = [];
  dyfTableCols: ColumnConfig[] = [];
  whatWasWrongTableCols: ColumnConfig[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

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
        { field: 'visits', header: this.i18n.service.translate('visits', lang), pipe: 'number' },
        { field: 'change', header: this.i18n.service.translate('%-change', lang), pipe: 'percent' },
      ];
      this.taskSuccessByUxTestCols = [
        { field: 'title', header: this.i18n.service.translate('ux-test', lang), },
        { field: '0', header: this.i18n.service.translate('project', lang) },
        { field: 'date', header: this.i18n.service.translate('date', lang), pipe: 'date', pipeParam: 'YYYY-MM-dd' },
        { field: 'testType', header: this.i18n.service.translate('test-type', lang) },
        { field: 'successRate', header: this.i18n.service.translate('success-rate', lang), pipe: 'percent' },
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

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
