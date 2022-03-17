import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-details',
  templateUrl: './page-details.component.html',
  styleUrls: ['./page-details.component.css'],
})
export class PageDetailsComponent implements OnInit {
  navTabs: { href: string; title: string }[] = [];
  constructor() {}

  ngOnInit(): void {
    this.navTabs = [
      { href: 'summary', title: 'Summary' },
      { href: 'webtraffic', title: 'Web Traffic' },
      { href: 'search_analytics', title: 'Search Analytics' },
      { href: 'feedback', title: 'Page Feedback' },
    ];
  }
}
