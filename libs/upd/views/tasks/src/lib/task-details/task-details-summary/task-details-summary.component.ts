import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

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

  currentLang$ = this.i18n.currentLang$;
  currentLang!: LocaleId;

  visitsByPageCols: ColumnConfig[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.taskSuccessByUxTestCols = [
        { field: 'title', header: 'UX Test' },
        { field: '0', header: 'Project' },
        {
          field: 'date',
          header: 'Date',
          pipe: 'date',
          pipeParam: 'YYYY-MM-dd',
        },
        { field: 'testType', header: 'Test type' },
        { field: 'successRate', header: 'Success rate', pipe: 'percent' },
      ] as ColumnConfig[];

      this.visitsByPageCols = [
        {
          field: 'title',
          header: 'Page title',
          type: 'link',
          typeParams: { preLink: '/pages', link: '_id' },
        },
        {
          field: 'url',
          header: 'Url',
          type: 'link',
          typeParams: { link: 'url', external: true },
        },
        { field: 'visits', header: 'Visits', pipe: 'number' },
        {
          field: 'percentChange',
          header: this.i18n.service.translate('comparison', lang),
          pipe: 'percent',
        },
      ] as ColumnConfig[];
    });
  }

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
