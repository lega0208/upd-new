import { Component, inject, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import type { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import type { PagesHomeAggregatedData } from '@dua-upd/types-common';
import { PagesHomeFacade } from './+state/pages-home.facade';
import { createCategoryConfig } from '@dua-upd/upd/utils';

@Component({
  selector: 'upd-pages-home',
  templateUrl: './pages-home.component.html',
  styleUrls: ['./pages-home.component.css'],
})
export class PagesHomeComponent implements OnInit {
  private pagesHomeService = inject(PagesHomeFacade);
  private i18n = inject(I18nFacade);

  pagesHomeData$ = this.pagesHomeService.pagesHomeTableData$;
  loading$ = this.pagesHomeService.loading$;

  currentLang$ = this.i18n.currentLang$;

  columns: ColumnConfig<PagesHomeAggregatedData>[] = [];

  searchFields = this.columns.map((col) => col.field);

  ngOnInit() {
    combineLatest([this.pagesHomeData$, this.currentLang$]).subscribe(
      ([data, lang]) => {
        this.columns = [
          {
            field: 'title',
            header: this.i18n.service.translate('Title', lang),
            type: 'link',
            typeParam: '_id',
          },
          {
            field: 'pageStatus',
            header: this.i18n.service.translate('Current status', lang),
            type: 'label',
            typeParam: 'pageStatus',
            filterConfig: {
              type: 'pageStatus',
              categories: createCategoryConfig({
                i18n: this.i18n.service,
                data,
                field: 'pageStatus',
              }),
            },
          },
          {
            field: 'url',
            header: this.i18n.service.translate('URL', lang),
            type: 'link',
            typeParams: { link: 'url', external: true },
          },
          {
            field: 'visits',
            header: this.i18n.service.translate('visits', lang),
            pipe: 'number',
          },
        ];
      },
    );

    this.pagesHomeService.fetchData();
    this.searchFields = this.columns.map((col) => col.field);
  }
}
