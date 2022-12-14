import { Component, OnInit } from '@angular/core';
import { OverviewFacade } from './+state/overview/overview.facade';

import { I18nFacade } from '@dua-upd/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'upd-overview',
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  navTabs: { href: string; title: string }[] = []

  currentLang$ = this.i18n.currentLang$;
  loading$ = this.overviewService.loading$;
  currentRoute$ = this.overviewService.currentRoute$;

  constructor(private overviewService: OverviewFacade, private i18n: I18nFacade) {}

  ngOnInit() {
    this.overviewService.init();
    console.log('overview init');

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
