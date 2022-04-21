import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-webtraffic',
  templateUrl: './project-details-webtraffic.component.html',
  styleUrls: ['./project-details-webtraffic.component.css'],
})
export class ProjectDetailsWebtrafficComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;
  currentLang!: LocaleId;

  visits$ = this.projectsDetailsService.visits$;

  visitsByPage$ = this.projectsDetailsService.visitsByPageWithPercentChange$;
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
          {
            field: 'percentChange',
            header: this.i18n.service.translate('comparison', lang),
            pipe: 'percent',
          }
        ];
    });
  }

  constructor(
    private readonly projectsDetailsService: ProjectsDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
