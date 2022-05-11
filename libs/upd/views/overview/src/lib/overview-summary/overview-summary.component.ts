import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { I18nFacade } from '@cra-arc/upd/state';
import { LocaleId } from '@cra-arc/upd/i18n';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-overview-summary',
  templateUrl: './overview-summary.component.html',
  styleUrls: ['./overview-summary.component.css'],
})
export class OverviewSummaryComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  chartMerge$ = this.overviewService.chartMerge$;

  loaded$ = this.overviewService.loaded$;
  loading$ = this.overviewService.loading$;
  error$ = this.overviewService.error$;

  uniqueVisitors$ = this.overviewService.visitors$;
  uniqueVisitorsPercentChange$ = this.overviewService.visitorsPercentChange$;

  visits$ = this.overviewService.visits$;
  visitsPercentChange$ = this.overviewService.visitsPercentChange$;

  pageViews$ = this.overviewService.views$;
  pageViewsPercentChange$ = this.overviewService.viewsPercentChange$;

  gscImpressions$ = this.overviewService.impressions$;
  gscImpressionsPercentChange$ = this.overviewService.impressionsPercentChange$;

  gscCTR$ = this.overviewService.ctr$;
  gscCTRPercentChange$ = this.overviewService.ctrPercentChange$;

  gscAverage$ = this.overviewService.avgRank$;
  gscAveragePercentChange$ = this.overviewService.avgRankPercentChange$;

  taskSurvey: { id: number; task: string; completion: number }[] = taskSurvey;
  //taskSurveyCols: { field: string; header: string }[] = taskSurveyCols;

  dyfChart$ = this.overviewService.dyfData$;
  whatWasWrongChart$ = this.overviewService.whatWasWrongData$;

  barChartData$ = this.overviewService.visitsByDay$;
  calldriversChartData$ = this.overviewService.calldriversByDay$;

  barTable$ = this.overviewService.barTable$;

  label = 'Visits';

  dateRangeLabel$ = this.overviewService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.overviewService.comparisonDateRangeLabel$;

  isChartDataOver31Days$ = this.overviewService.isChartDataOver31Days$;

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  dyfTableCols: ColumnConfig<{ name: string; value: string; }>[] = [];
  whatWasWrongTableCols: ColumnConfig<{ name: string; value: string; }>[] = [];
  barTableCols: ColumnConfig<{ name: string; currValue: string; prevValue: string; }>[] = [];
  taskSurveyCols: ColumnConfig[] = [];

  ngOnInit() {
    combineLatest([
      this.currentLang$,
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
    ]).subscribe(([lang, dateRange, comparisonDateRange]) => {
      this.dyfTableCols = [
        {
          field: 'name',
          header: this.i18n.service.translate('Selection', lang),
        },
        {
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
      ];
      this.whatWasWrongTableCols = [
        { field: 'name', header: this.i18n.service.translate('d3-www', lang) },
        {
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
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
      this.taskSurveyCols = [
        { field: 'task', header: this.i18n.service.translate('task', lang) },
        {
          field: 'completion',
          header: this.i18n.service.translate(
            'Task Success Survey Completed',
            lang
          ),
        },
      ];
    });
  }
}

const taskSurvey = [
  { id: 1, task: 'Shufflester', completion: 191 },
  { id: 2, task: 'Yotz', completion: 189 },
  { id: 3, task: 'Shuffletag', completion: 65 },
  { id: 4, task: 'Feednation', completion: 132 },
  { id: 5, task: 'Zoonder', completion: 153 },
  { id: 6, task: 'Jabbersphere', completion: 97 },
  { id: 7, task: 'Devpulse', completion: 84 },
  { id: 8, task: 'Photofeed', completion: 172 },
  { id: 9, task: 'Meemm', completion: 205 },
  { id: 10, task: 'Jetwire', completion: 176 },
];

const taskSurveyCols = [
  { field: 'task', header: 'Task' },
  { field: 'completion', header: 'Task Success Survey Completed' },
];
