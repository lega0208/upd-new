import { Component, OnInit } from '@angular/core';
import { PagesDetailsFacade } from './+state/pages-details.facade';

@Component({
  selector: 'app-page-details',
  templateUrl: './pages-details.component.html',
  styleUrls: ['./pages-details.component.css'],
})
export class PagesDetailsComponent implements OnInit {
  title$ = this.pageDetailsService.pageTitle$;

  navTabs: { href: string; title: string }[] = [
    { href: 'summary', title: 'Summary' },
    { href: 'webtraffic', title: 'Web Traffic' },
    { href: 'search_analytics', title: 'Search Analytics' },
    { href: 'feedback', title: 'Page Feedback' },
    { href: 'details', title: 'Details' },
  ];

  constructor(private pageDetailsService: PagesDetailsFacade) {}

  ngOnInit(): void {
    this.pageDetailsService.init();
  }
}
