import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';

import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import { PagesHomeAggregatedData } from '@dua-upd/types-common';
import { PagesHomeFacade } from './+state/pages-home.facade';

@Component({
  selector: 'upd-pages-home',
  templateUrl: './pages-home.component.html',
  styleUrls: ['./pages-home.component.css'],
})
export class PagesHomeComponent implements OnInit {
  pagesHomeData$ = this.pagesHomeService.pagesHomeTableData$;
  loading$ = this.pagesHomeService.loading$;

  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  columns: ColumnConfig<PagesHomeAggregatedData>[] = [];

  searchFields = this.columns.map((col) => col.field).concat(['all_urls'])

  ngOnInit() {
    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';

      this.columns = [
        {
          field: 'title',
          header: this.i18n.service.translate('Title', lang),
          type: 'link',
          typeParam: '_id',
        },
        {
          field: 'url',
          header: this.i18n.service.translate('URL', lang),
          type: 'link',
          typeParam: '_id',
        },
        {
          field: 'visits',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
      ];
    });

    this.pagesHomeService.fetchData();
    this.searchFields = this.columns.map((col) => col.field).concat(['all_urls'])
  }

  constructor(
    private pagesHomeService: PagesHomeFacade,
    private i18n: I18nFacade
  ) {}
}
