import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { GetTableProps } from '@dua-upd/utils-common';
import { PagesDetailsFacade } from '../+state/pages-details.facade';

type VisitorLocationColTypes = GetTableProps<
  PagesDetailsWebtrafficComponent,
  'visitorLocation$'
>;
type BarTableColTypes = GetTableProps<
  PagesDetailsWebtrafficComponent,
  'barTable$'
>;

@Component({
  selector: 'upd-page-details-webtraffic',
  templateUrl: './pages-details-webtraffic.component.html',
  styleUrls: ['./pages-details-webtraffic.component.css'],
})
export class PagesDetailsWebtrafficComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  apexBar$ = this.pageDetailsService.apexBar$;

  visitsByDay$ = this.pageDetailsService.visitsByDay$;

  visitorLocation$ = this.pageDetailsService.visitorLocation$;

  visitorLocationCols: ColumnConfig<VisitorLocationColTypes>[] = [];

  barTable$ = this.pageDetailsService.barTable$;
  barTableCols: ColumnConfig<BarTableColTypes>[] = [];

  dateRangeLabel$ = this.pageDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.pageDetailsService.comparisonDateRangeLabel$;

  ngOnInit() {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([
      this.currentLang$,
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
    ]).subscribe(([lang, dateRange, comparisonDateRange]) => {
      this.visitorLocationCols = [
        {
          field: 'province',
          header: this.i18n.service.translate('province', lang),
        },
        {
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
        {
          field: 'change',
          header: this.i18n.service.translate('comparison', lang),
          pipe: 'percent',
        },
      ];

      this.barTableCols = [
        { field: 'date', header: this.i18n.service.translate('Dates', lang) },
        {
          field: 'visits',
          header: this.i18n.service.translate('Visits for ', lang, {
            value: dateRange,
          }),
          pipe: 'number',
        },
        { field: 'prevDate', header: this.i18n.service.translate('Dates', lang) },
        {
          field: 'prevVisits',
          header: this.i18n.service.translate('Visits for ', lang, {
            value: comparisonDateRange,
          }),
          pipe: 'number',
        },
      ];
    });
  }

  constructor(
    private pageDetailsService: PagesDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
