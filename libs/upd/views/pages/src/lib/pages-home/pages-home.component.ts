import { Component, OnInit } from '@angular/core';
import { PagesHomeFacade } from './+state/pages-home.facade';

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { columnConfig } from 'libs/upd/components/src/lib/data-table-styles/types';

@Component({
  selector: 'app-pages-home',
  templateUrl: './pages-home.component.html',
  styleUrls: ['./pages-home.component.css'],
})
export class PagesHomeComponent implements OnInit {
  pagesHomeData$ = this.pagesHomeService.pagesHomeData$;

  columns: columnConfig[] = [
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
