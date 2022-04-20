import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'app-task-details-webtraffic',
  templateUrl: './task-details-webtraffic.component.html',
  styleUrls: ['./task-details-webtraffic.component.css'],
})
export class TaskDetailsWebtrafficComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;
  currentLang!: LocaleId;

  visitsByPage$ = this.taskDetailsService.visitsByPageWithPercentChange$;

  visits$ = this.taskDetailsService.visits$;
  visitsPercentChange$ = this.taskDetailsService.visitsPercentChange$;

  visitsByPageCols: ColumnConfig[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
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
