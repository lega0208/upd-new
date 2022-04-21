import { Component, OnInit } from '@angular/core';
import { OverviewFacade } from './+state/overview/overview.facade';

import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  // navTabs: { href: string; title: string }[] = [
  //   { href: 'summary', title: 'Summary' },
  //   { href: 'webtraffic', title: 'Web Traffic' },
  //   { href: 'searchanalytics', title: 'Search Analytics' },
  //   { href: 'pagefeedback', title: 'Page Feedback' },
  //   { href: 'calldrivers', title: 'Call drivers' },
  //   { href: 'uxtests', title: 'UX tests' },
  // ];

  navTabs: { href: string; title: string }[] = []

  currentLang$ = this.i18n.currentLang$;
  loading$ = this.overviewService.loading$;

  constructor(private overviewService: OverviewFacade, private i18n: I18nFacade) {}

  ngOnInit() {
    this.overviewService.init();

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
      ];
    });
  }
}
