import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {

  navTabs: Array<{ href: string, title: string}> = [];

  ngOnInit(): void {
    this.navTabs = [
      { href: 'summary', title: 'Summary'},
      { href: 'webtraffic', title: 'Web Traffic'},
      { href: 'search_analytics', title: 'Search Analytics'},
      { href: 'calldrivers', title: 'Call drivers'},
      { href: 'uxtests', title: 'UX tests'}
    ]
  }
  
 }
