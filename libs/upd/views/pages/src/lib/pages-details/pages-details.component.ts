import { Component, OnInit } from '@angular/core';
import { PagesDetailsFacade } from './+state/pages-details.facade';

//import { TranslateService } from '@ngx-translate/core';

import { ColumnConfig } from '@cra-arc/upd-components';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-page-details',
  templateUrl: './pages-details.component.html',
  styleUrls: ['./pages-details.component.css'],
})
export class PagesDetailsComponent implements OnInit {
  title$ = this.pageDetailsService.pageTitle$;
  url$ = this.pageDetailsService.pageUrl$;
  loading$ = this.pageDetailsService.loading$;
  startSession$ = this.pageDetailsService.startSession$;
  currentLang$ = this.i18n.currentLang$;
  showUrl = true;
  showAlert = false;

  // navTabs: { href: string; title: string }[] = [
  //   { href: 'summary', title: 'Summary' },
  //   { href: 'webtraffic', title: 'Web Traffic' },
  //   { href: 'searchanalytics', title: 'Search Analytics' },
  //   { href: 'pagefeedback', title: 'Page Feedback' },
  //   // { href: 'details', title: 'Details' },
  // ];

  navTabs: { href: string; title: string }[] = []

  constructor(
    private pageDetailsService: PagesDetailsFacade,
    //public translateService: TranslateService,
    private i18n: I18nFacade
  ) {}

  ngOnInit(): void {
    this.pageDetailsService.init();
    +
    combineLatest([
      this.currentLang$
    ]).subscribe(([lang]) => {
      this.navTabs = [
        { href: 'summary', title: this.i18n.service.translate('tab-summary', lang) },
        { href: 'webtraffic', title: this.i18n.service.translate('tab-webtraffic', lang) },
        { href: 'searchanalytics', title: this.i18n.service.translate('tab-searchanalytics', lang) },
        { href: 'pagefeedback', title: this.i18n.service.translate('tab-pagefeedback', lang) },
        // { href: 'details', title: this.i18n.service.translate('tab-details', lang) },
      ];
    });
  }

  toggleUrl() {
    this.showUrl = !this.showUrl;
  }

  toggleAlert() {
    this.showAlert = !this.showAlert;
  }
}
