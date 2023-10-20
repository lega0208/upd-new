import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import {
  ColumnConfig,
} from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { PagesHomeFacade } from '../+state/pages-home.facade';
import { PagesHomeAggregatedData } from '@dua-upd/types-common';

@Component({
  selector: 'upd-pages-bulk-report',
  templateUrl: './pages-bulk-report.component.html',
  styleUrls: ['./pages-bulk-report.component.css'],
})
export class PagesBulkReportComponent implements OnInit {
  pagesHomeData$ = this.pagesHomeService.pagesHomeTableData$;
  loading$ = this.pagesHomeService.loading$;

  currentLang$ = this.i18n.currentLang$;

  columns: ColumnConfig<PagesHomeAggregatedData>[] = [];

  searchFields = this.columns.map((col) => col.field);

  
  selectedPages: any[] = [];
  
  urls: string[] = [];

  addPages(inputValue: string) {
    const parsedUrls = inputValue.split(/[\n,;]+/)
      .map(url => url.trim())
      .filter(url => url.length > 0);

    const selectedUrls = this.selectedPages.map(page => page.url);

    const combinedUrls = [...selectedUrls, ...parsedUrls];
    
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
    this.searchFields = this.columns
      .map((col) => col.field);
  }

handleSelectedPages(pages: any[]) {
  this.selectedPages = pages;
}

  constructor(
    private pagesHomeService: PagesHomeFacade,
    private i18n: I18nFacade
  ) {}
}
