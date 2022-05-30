import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { ProjectsDetailsFacade } from './+state/projects-details.facade';

import { I18nFacade } from '@dua-upd/upd/state';
import { combineLatest } from 'rxjs';
import { EN_CA } from '@dua-upd/upd/i18n';

@Component({
  selector: 'upd-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
})
export class ProjectDetailsComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  title$ = combineLatest([
    this.projectsDetailsService.title$,
    this.currentLang$,
  ]).pipe(
    map(([title, lang]) =>
      title ? this.i18n.service.translate(title, lang) : ''
    )
  );

  status$ = this.projectsDetailsService.status$;
  loaded$ = this.projectsDetailsService.loaded$;
  currentRoute$ = this.projectsDetailsService.currentRoute$;

  navTabs: { href: string; title: string }[] = [];

  constructor(
    private readonly projectsDetailsService: ProjectsDetailsFacade,
    public i18n: I18nFacade
  ) {}

  ngOnInit() {
    this.projectsDetailsService.init();

    this.currentLang$.subscribe((lang) => {
      this.navTabs = [
        {
          href: 'summary',
          title: this.i18n.service.translate('tab-summary', lang),
        },
        {
          href: 'webtraffic',
          title: this.i18n.service.translate('tab-webtraffic', lang),
        },
        {
          href: 'searchanalytics',
          title: this.i18n.service.translate('tab-searchanalytics', lang),
        },
        {
          href: 'pagefeedback',
          title: this.i18n.service.translate('tab-pagefeedback', lang),
        },
        {
          href: 'calldrivers',
          title: this.i18n.service.translate('tab-calldrivers', lang),
        },
        {
          href: 'uxtests',
          title: this.i18n.service.translate('tab-uxtests', lang),
        },
        // { href: 'details', title: this.i18n.service.translate('tab-details', lang) },
      ];

      this.langLink = lang === EN_CA ? 'en' : 'fr';
    });
  }
}
