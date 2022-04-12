import { Component, OnInit } from '@angular/core';
import { PagesDetailsFacade } from './+state/pages-details.facade';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-page-details',
  templateUrl: './pages-details.component.html',
  styleUrls: ['./pages-details.component.css'],
})
export class PagesDetailsComponent implements OnInit {
  title$ = this.pageDetailsService.pageTitle$;
  url$ = this.pageDetailsService.pageUrl$;
  showUrl = true;
  showAlert = false;

  navTabs: { href: string; title: string }[] = [
    { href: 'summary', title: 'Summary' },
    { href: 'webtraffic', title: 'Web Traffic' },
    { href: 'searchanalytics', title: 'Search Analytics' },
    { href: 'pagefeedback', title: 'Page Feedback' },
    // { href: 'details', title: 'Details' },
  ];

  constructor(private pageDetailsService: PagesDetailsFacade, public translateService:TranslateService) {}

  ngOnInit(): void {
    this.pageDetailsService.init();
  }

  toggleUrl() {
    this.showUrl = !this.showUrl;
  }

  toggleAlert() {
    this.showAlert = !this.showAlert;
  }
}
