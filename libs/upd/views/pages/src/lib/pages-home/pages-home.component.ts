import { Component, OnInit } from '@angular/core';
import { PagesHomeFacade } from './+state/pages-home.facade';

import { ColumnConfig } from '@cra-arc/upd-components';

@Component({
  selector: 'app-pages-home',
  templateUrl: './pages-home.component.html',
  styleUrls: ['./pages-home.component.css'],
})
export class PagesHomeComponent implements OnInit {
  pagesHomeData$ = this.pagesHomeService.pagesHomeTableData$;
  loading$ = this.pagesHomeService.loading$;

  columns: ColumnConfig[] = [
    {
      field: 'url',
      header: 'Url',
      type: 'link',
      typeParam: '_id',
      tooltip: 'Url tooltip',
    },
    { field: 'title', header: 'Title', tooltip: 'Title tooltip' },
    {
      field: 'visits',
      header: 'Visits',
      pipe: 'number',
    },
  ];

  ngOnInit() {
    this.pagesHomeService.fetchData();
  }

  constructor(private pagesHomeService: PagesHomeFacade) {}
}
