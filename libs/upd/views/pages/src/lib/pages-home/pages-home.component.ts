import { Component, OnInit } from '@angular/core';
import { PagesHomeFacade } from './+state/pages-home.facade';

@Component({
  selector: 'app-pages-home',
  templateUrl: './pages-home.component.html',
  styleUrls: ['./pages-home.component.css'],
})
export class PagesHomeComponent implements OnInit {
  pagesHomeData$ = this.pagesHomeService.pagesHomeData$;

  columns = [
    { field: 'url', header: 'Url' },
    { field: 'title', header: 'Title' },
    { field: 'visits', header: 'Visits' },
  ]

  ngOnInit() {
    this.pagesHomeService.fetchData();
  }

  constructor(private pagesHomeService: PagesHomeFacade) {}
}
