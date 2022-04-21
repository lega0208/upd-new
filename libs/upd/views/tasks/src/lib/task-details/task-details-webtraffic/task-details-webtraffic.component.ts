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
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

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
          header: this.i18n.service.translate('page-title', lang),
          type: 'link',
          typeParams: { preLink: '/pages', link: '_id' },
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
    });
  }

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
