import { Component, OnInit } from '@angular/core';
import { OverviewFacade } from './+state/overview/overview.facade';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  navTabs: { href: string; title: string }[] = [
    { href: 'summary', title: 'Summary' },
    { href: 'webtraffic', title: 'Web Traffic' },
    { href: 'searchanalytics', title: 'Search Analytics' },
    { href: 'pagefeedback', title: 'Page Feedback' },
    { href: 'calldrivers', title: 'Call drivers' },
    { href: 'uxtests', title: 'UX tests' },
  ];

  loading$ = this.overviewService.loading$;

  constructor(private overviewService: OverviewFacade) {}

  ngOnInit() {
    this.overviewService.init();
  }
}
