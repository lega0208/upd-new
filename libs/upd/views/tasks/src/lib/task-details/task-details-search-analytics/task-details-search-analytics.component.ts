import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'app-task-details-search-analytics',
  templateUrl: './task-details-search-analytics.component.html',
  styleUrls: ['./task-details-search-analytics.component.css'],
})
export class TaskDetailsSearchAnalyticsComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  gscTotalClicks$ = this.taskDetailsService.gscTotalClicks$;

  gscTotalImpressions$ = this.taskDetailsService.gscTotalImpressions$;
  gscTotalImpressionsPercentChange$ =
    this.taskDetailsService.gscTotalImpressionsPercentChange$;
  gscTotalCtr$ = this.taskDetailsService.gscTotalCtr$;
  gscTotalCtrPercentChange$ = this.taskDetailsService.gscTotalCtrPercentChange$;
  gscTotalPosition$ = this.taskDetailsService.gscTotalPosition$;
  gscTotalPositionPercentChange$ =
    this.taskDetailsService.gscTotalPositionPercentChange$;

  visitsByPage$ = this.taskDetailsService.visitsByPageGSCWithPercentChange$;
  visitsByPageCols: ColumnConfig[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.visitsByPageCols = [
        {
          field: 'url',
          header: 'Url',
          type: 'link',
          typeParams: { preLink: '/pages', link: '_id' },
        },
        {
          field: 'gscTotalClicks',
          header: 'Clicks',
          pipe: 'number',
          type: 'link',
          typeParams: {
            preLink: '/pages',
            link: '_id',
            postLink: 'searchanalytics',
          },
        },
        {
          field: 'gscTotalImpressions',
          header: 'Impressions',
          pipe: 'number',
          type: 'link',
          typeParams: {
            preLink: '/pages',
            link: '_id',
            postLink: 'searchanalytics',
          },
        },
        {
          field: 'gscTotalCtr',
          header: 'CTR (Click Through Rate)',
          pipe: 'percent',
        },
        {
          field: 'gscTotalPosition',
          header: 'Position',
          pipe: 'number',
        },
        {
          field: 'percentChange',
          header: this.i18n.service.translate('comparison', lang),
          pipe: 'percent',
        },
      ];
    });
  }

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
