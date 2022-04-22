import { Component, OnInit } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';

//import { TranslateService } from '@ngx-translate/core';
import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { ColumnConfig } from '@cra-arc/upd-components';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-page-details-summary',
  templateUrl: './pages-details-summary.component.html',
  styleUrls: ['./pages-details-summary.component.css'],
})
export class PagesDetailsSummaryComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  data$ = this.pageDetailsService.pagesDetailsData$;
  error$ = this.pageDetailsService.error$;

  url$ = this.pageDetailsService.pageUrl$;

  visitors$ = this.pageDetailsService.visitors$;
  visitorsPercentChange$ = this.pageDetailsService.visitorsPercentChange$;

  visits$ = this.pageDetailsService.visits$;
  visitsPercentChange$ = this.pageDetailsService.visitsPercentChange$;

  pageViews$ = this.pageDetailsService.pageViews$;
  pageViewsPercentChange$ = this.pageDetailsService.pageViewsPercentChange$;

  visitsByDay$ = this.pageDetailsService.visitsByDay$;

  visitsByDeviceType$ = this.pageDetailsService.visitsByDeviceType$;

  topSearchTermsIncrease$ = this.pageDetailsService.topSearchTermsIncrease$;

  topSearchTermsDecrease$ = this.pageDetailsService.topSearchTermsDecrease$;

  dateRangeLabel$ = this.pageDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.pageDetailsService.comparisonDateRangeLabel$;

  barTable$ = this.pageDetailsService.barTable$;
  barTableCols: ColumnConfig[] = [];

  visitsByDeviceTypeTable$ = this.pageDetailsService.visitsByDeviceTypeTable$;
  visitsByDeviceTypeCols: ColumnConfig[] = [];

  constructor(
    private pageDetailsService: PagesDetailsFacade,
    //public translateService: TranslateService,
    private i18n: I18nFacade
  ) {}

  topSearchTermsCols: ColumnConfig[] = [];

  ngOnInit() {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([
      this.currentLang$,
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
    ]).subscribe(([lang, dateRange, comparisonDateRange]) => {
      this.topSearchTermsCols = [
        {
          field: 'term',
          header: this.i18n.service.translate('search-term', lang),
        },
        {
          field: 'change',
          header: this.i18n.service.translate('comparison', lang),
        },
        {
          field: 'impressions',
          header: this.i18n.service.translate('impressions', lang),
        },
        { field: 'ctr', header: this.i18n.service.translate('ctr', lang) },
        {
          field: 'position',
          header: this.i18n.service.translate('position', lang),
        },
      ];
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
      this.visitsByDeviceTypeCols = [
        {
          field: 'name',
          header: this.i18n.service.translate('Device Type', lang),
        },
        { field: 'currValue', header: dateRange, pipe: 'number' },
        { field: 'prevValue', header: comparisonDateRange, pipe: 'number' },
      ];
    });
  }
}
