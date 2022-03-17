import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.css'],
})
export class PagesComponent implements OnInit {
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
