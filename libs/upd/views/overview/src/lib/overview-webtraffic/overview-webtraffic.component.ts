import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { I18nFacade } from '@cra-arc/upd/state';
import { LocaleId } from '@cra-arc/upd/i18n';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-overview-webtraffic',
  templateUrl: './overview-webtraffic.component.html',
  styleUrls: ['./overview-webtraffic.component.css'],
})
export class OverviewWebtrafficComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  uniqueVisitors$ = this.overviewService.visitors$;
  uniqueVisitorsPercentChange$ = this.overviewService.visitorsPercentChange$;

  visits$ = this.overviewService.visits$;
  visitsPercentChange$ = this.overviewService.visitsPercentChange$;

  pageViews$ = this.overviewService.views$;
  pageViewsPercentChange$ = this.overviewService.viewsPercentChange$;

  isChartDataOver31Days$ = this.overviewService.isChartDataOver31Days$;

  topPagesData$ = this.overviewService.topPagesVisited$;
  topPagesWithChangeData$ =
    this.overviewService.topPagesVisitedWithPercentChange$;

  barChartData$ = this.overviewService.visitsByDay$;
  barTable$ = this.overviewService.barTable$;

  label = 'Visits';

  dateRangeLabel$ = this.overviewService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.overviewService.comparisonDateRangeLabel$;

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  topPagesCols: ColumnConfig<{ _id: string; visits: number; percentChange: number }>[] = [];
  barTableCols: ColumnConfig<{ name: string; currValue: number; prevValue: number }>[] = [];

  ngOnInit() {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([
      this.currentLang$,
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
    ]).subscribe(([lang, dateRange, comparisonDateRange]) => {
      this.topPagesCols = [
        {
          field: '_id',
          header: this.i18n.service.translate('URL', lang),
          type: 'link',
          typeParams: { link: '_id', external: true },
        },
        {
          field: 'visits',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
        {
          field: 'percentChange',
          header: this.i18n.service.translate('comparison', lang),
          pipe: 'percent',
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
    });
  }
}
