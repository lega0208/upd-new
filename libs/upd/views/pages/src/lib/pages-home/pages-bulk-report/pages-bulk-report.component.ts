import { Component, OnInit, inject } from '@angular/core';
import { combineLatest } from 'rxjs';
import {
  ColumnConfig,
} from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { PagesHomeFacade } from '../+state/pages-home.facade';
import { PagesHomeAggregatedData } from '@dua-upd/types-common';
import { Dayjs } from 'dayjs';

@Component({
  selector: 'upd-pages-bulk-report',
  templateUrl: './pages-bulk-report.component.html',
  styleUrls: ['./pages-bulk-report.component.css'],
})
export class PagesBulkReportComponent implements OnInit {
  
  private i18n = inject(I18nFacade);
  private readonly pagesHomeService = inject(PagesHomeFacade);
  pagesHomeData$ = this.pagesHomeService.pagesHomeTableData$;
  loading$ = this.pagesHomeService.loading$;

  currentLang$ = this.i18n.currentLang$;

  allSelected = false;

  columns: ColumnConfig<PagesHomeAggregatedData>[] = [];

  searchFields = this.columns.map((col) => col.field);

  validUrls: string[] = [];
  
  selectedPages: any[] = [];
  selectedCategories: string[] = [];
  
  urls: string[] = [];

  categories: { key: string, name: string }[] = [
    { name: 'Visits', key: 'A' },
    { name: 'Visitor location', key: 'M' },
    { name: 'Device type', key: 'P' },
    { name: 'Search - Google', key: 'R' },
    { name: 'Search - Canada.ca', key: 'S' },
    { name: 'Page feedback', key: 'T' },
  ];

  addPages(inputValue: string) {
    const parsedUrls = inputValue.split(/[\n,;]+/)
      .map(url => url.trim().replace(/^https?:\/\//, ''))
      .filter(url => url.length > 0);

    const validatedUrls = parsedUrls.filter(url => this.validUrls.includes(url));

    const selectedUrls = this.selectedPages.map(page => page.url);
    const combinedUrls = [...selectedUrls, ...validatedUrls];
    
    this.urls = Array.from(new Set(combinedUrls));
  }

  removePage(index: number) {
    this.urls.splice(index, 1);
  }

  ngOnInit() {
    combineLatest([this.pagesHomeData$, this.currentLang$]).subscribe(
      ([data, lang]) => {
      this.columns = [
        {
          field: 'title',
          header: this.i18n.service.translate('Title', lang),
        },
        {
          field: 'url',
          header: this.i18n.service.translate('URL', lang),
        },
      ];
    });

    this.pagesHomeService.fetchData();
    this.pagesHomeData$.subscribe(data => {
      this.validUrls = data.map(page => page.url);
    });
    this.searchFields = this.columns
      .map((col) => col.field);
  }

handleSelectedPages(pages: any[]) {
  this.selectedPages = pages;
}

handleRangeSelected(range: { start: Dayjs, end: Dayjs }) {
  console.log("Selected range:", range.start.format('YYYY-MM-DD'), "to", range.end.format('YYYY-MM-DD'));
}

get urlsCount(): number {
  return this.urls.length;
}

toggleSelectAll() {
  console.log("allSelected:", this.allSelected, "selectedCategories:", this.selectedCategories)
  if (!this.allSelected) {
      this.selectAll();
  } else {
      this.deselectAll();
  }
}

selectAll() {
  this.selectedCategories = this.categories.map(item => item.name);
  this.allSelected = true;
}

deselectAll() {
  this.selectedCategories = [];
  this.allSelected = false;
}


}
