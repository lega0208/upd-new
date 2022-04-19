import { Component } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { I18nFacade } from '@cra-arc/upd/state';
import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-overview-webtraffic',
  templateUrl: './overview-webtraffic.component.html',
  styleUrls: ['./overview-webtraffic.component.css'],
})
export class OverviewWebtrafficComponent {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  uniqueVisitors$ = this.overviewService.visitors$;
  uniqueVisitorsPercentChange$ = this.overviewService.visitorsPercentChange$;

  visits$ = this.overviewService.visits$;
  visitsPercentChange$ = this.overviewService.visitsPercentChange$;

  pageViews$ = this.overviewService.views$;
  pageViewsPercentChange$ = this.overviewService.viewsPercentChange$;

  topPagesData$ = this.overviewService.topPagesVisited$;
  topPagesCols: ColumnConfig[] = [
    { field: '_id', header: 'URL' },
    { field: 'visits', header: 'Visits', pipe: 'number' },
    { field: 'comparison', header: 'Comparison' },
  ];

  barChartData$ = this.overviewService.visitsByDay$;
  barTable$ = this.overviewService.barTable$;

  label = 'Visits';

  dateRangeLabel$ = this.overviewService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.overviewService.comparisonDateRangeLabel$;

  barTableCols: ColumnConfig[] = [
    { field: 'name', header: 'Dates' },
    {
      field: 'currValue',
      header: `Visits for ${this.dateRangeLabel$}`,
      pipe: 'number',
    },
    { field: 'prevValue', header: 'Visits for ', pipe: 'number' },
  ];

  constructor(
    private overviewService: OverviewFacade,  
    private i18n: I18nFacade
  ) {}

  dyfTableCols2: ColumnConfig[] = [];
  topPagesCols2: ColumnConfig[] = [];
  barTableCols2: ColumnConfig[] = [];

  ngOnInit() {
    this.i18n.service.onLangChange(
      ({ lang }) => { this.currentLang = lang as LocaleId; }
    );

    combineLatest([this.currentLang$, this.dateRangeLabel$, this.comparisonDateRangeLabel$]).subscribe(([lang, dateRange, comparisonDateRange]) => {
      
      this.topPagesCols2 = [
        { field: '_id', header: this.i18n.service.translate('URL', lang) },
        { field: 'visits', header: this.i18n.service.translate('visits', lang), pipe: 'number' },
        { field: 'comparison',  header: this.i18n.service.translate('comparison', lang)},
      ];
      this.barTableCols2 = [
        { field: 'name', header: this.i18n.service.translate('Dates', lang) },
        //{ field: 'currValue', header: `Visits for ${this.dateRangeLabel$}`, pipe: 'number' },
        { field: 'currValue', header: this.i18n.service.translate('Visits for ', lang, {value: dateRange  }), pipe: 'number' },
        { field: 'prevValue', header: this.i18n.service.translate('Visits for ', lang, {value: comparisonDateRange  }), pipe: 'number' }
      ];
    });
  }
}
