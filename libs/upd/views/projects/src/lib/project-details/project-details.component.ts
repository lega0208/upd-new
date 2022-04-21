import { Component, OnInit } from '@angular/core';
import { ProjectStatus } from '@cra-arc/types-common';
import { Observable } from 'rxjs';
import { ProjectsDetailsFacade } from './+state/projects-details.facade';

import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
})
export class ProjectDetailsComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  title$ = this.projectsDetailsService.title$;
  status$ = this.projectsDetailsService.status$ as Observable<ProjectStatus>;
  loaded$ = this.projectsDetailsService.loaded$;

  // navTabs: { href: string; title: string }[] = [
  //   { href: 'summary', title: 'Summary' },
  //   { href: 'webtraffic', title: 'Web Traffic' },
  //   { href: 'searchanalytics', title: 'Search Analytics' },
  //   { href: 'pagefeedback', title: 'Page Feedback' },
  //   { href: 'calldrivers', title: 'Call Drivers' },
  //   { href: 'uxtests', title: 'UX Tests' },
  //   { href: 'details', title: 'Details' },
  // ];

  navTabs: { href: string; title: string }[] = [];

  data$ = this.projectsDetailsService.projectsDetailsData$;

  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade, public i18n: I18nFacade) {}

  ngOnInit() {
    this.projectsDetailsService.init();
    
    combineLatest([
      this.currentLang$
    ]).subscribe(([lang]) => {
      this.navTabs = [
        { href: 'summary', title: this.i18n.service.translate('tab-summary', lang) },
        { href: 'webtraffic', title: this.i18n.service.translate('tab-webtraffic', lang) },
        { href: 'searchanalytics', title: this.i18n.service.translate('tab-searchanalytics', lang) },
        { href: 'pagefeedback', title: this.i18n.service.translate('tab-pagefeedback', lang) },
        { href: 'calldrivers', title: this.i18n.service.translate('tab-calldrivers', lang) },
        { href: 'uxtests', title: this.i18n.service.translate('tab-uxtests', lang) },
        // { href: 'details', title: this.i18n.service.translate('tab-details', lang) },
      ];
    });
  }
}
