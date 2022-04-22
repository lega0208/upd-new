import { Component, OnInit } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { ColumnConfig } from '@cra-arc/upd-components';

import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-page-details-webtraffic',
  templateUrl: './pages-details-webtraffic.component.html',
  styleUrls: ['./pages-details-webtraffic.component.css'],
})
export class PagesDetailsWebtrafficComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  visitsByDay$ = this.pageDetailsService.visitsByDay$;

  whereVisitorsCameFrom$ = this.pageDetailsService.topSearchTermsIncrease$;
  whatVisitorsClickedOn$ = this.pageDetailsService.topSearchTermsIncrease$;
  visitorLocation$ = this.pageDetailsService.visitorLocation$;

  visitorLocationCols: ColumnConfig[] = [];
  whatVisitorsClickedOnCols: ColumnConfig[] = [];
  whereVisitorsCameFromCols: ColumnConfig[] = [];

  barTable$ = this.pageDetailsService.barTable$;
  barTableCols: ColumnConfig[] = [];

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
      (this.visitorLocationCols = [
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
        },
      ]),
        (this.whatVisitorsClickedOnCols = [
          { field: 'text', header: this.i18n.service.translate('text', lang) },
          {
            field: 'clicks',
            header: this.i18n.service.translate('clicks', lang),
          },
          {
            field: 'change',
            header: this.i18n.service.translate('comparison', lang),
          },
        ]),
        (this.whereVisitorsCameFromCols = [
          {
            field: 'url',
            header: this.i18n.service.translate('previous-page-url', lang),
          },
          {
            field: 'visits',
            header: this.i18n.service.translate('visits', lang),
          },
          {
            field: 'change',
            header: this.i18n.service.translate('comparison', lang),
          },
        ]);
      this.barTableCols = [
        { field: 'name', header: this.i18n.service.translate('Dates', lang) },
        {
          field: 'currValue',
          header: this.i18n.service.translate('Visits for ', lang, {
            value: dateRange,
          }),
          pipe: 'number',
        },
        {
          field: 'prevValue',
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
