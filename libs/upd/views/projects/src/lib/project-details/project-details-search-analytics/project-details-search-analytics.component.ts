import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-search-analytics',
  templateUrl: './project-details-search-analytics.component.html',
  styleUrls: ['./project-details-search-analytics.component.css'],
})
export class ProjectDetailsSearchAnalyticsComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  gscTotalClicks$ = this.projectsDetailsService.gscTotalClicks$;

  gscTotalImpressions$ = this.projectsDetailsService.gscTotalImpressions$;
  gscTotalImpressionsPercentChange$ = this.projectsDetailsService.gscTotalImpressionsPercentChange$;

  gscTotalCtr$ = this.projectsDetailsService.gscTotalCtr$;
  gscTotalPosition$ = this.projectsDetailsService.gscTotalPosition$;

  visitsByPage$ = this.projectsDetailsService.visitsByPageGSCWithPercentChange$;
  visitsByPageCols: ColumnConfig[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.visitsByPageCols = [
        {
          field: 'url',
          header: this.i18n.service.translate('URL', lang),
          type: 'link',
          typeParams: { preLink: '/pages', link: '_id' },
        },
        {
          field: 'gscTotalClicks',
          header: this.i18n.service.translate('clicks', lang),
          pipe: 'number',
          type: 'link',
          typeParams: { preLink: '/pages', link: '_id', postLink: 'searchanalytics' },
        },
        {
          field: 'gscTotalImpressions',
          header: this.i18n.service.translate('impressions', lang),
          pipe: 'number',
          type: 'link',
          typeParams: { preLink: '/pages', link: '_id', postLink: 'searchanalytics' },
        },
        {
          field: 'gscTotalCtr',
          header: this.i18n.service.translate('ctr', lang),
          pipe: 'percent',
        },
        {
          field: 'gscTotalPosition',
          header: this.i18n.service.translate('position', lang),
          pipe: 'number',
        },
        { field: '0', header: this.i18n.service.translate('comparison-for-clicks', lang), pipe: 'percent' },
        {
          field: 'percentChange',
          header: this.i18n.service.translate('comparison', lang),
          pipe: 'percent',
        },
      ];
    });
  }

  constructor(
    private readonly projectsDetailsService: ProjectsDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
