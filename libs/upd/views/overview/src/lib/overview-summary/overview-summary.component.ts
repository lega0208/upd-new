import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  ColumnConfig,
  searchKpiObjectiveCriteria,
  uxTestsKpiObjectiveCriteria,
  feedbackKpiObjectiveCriteria,
} from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA, LocaleId } from '@dua-upd/upd/i18n';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'upd-overview-summary',
  templateUrl: './overview-summary.component.html',
  styleUrls: ['./overview-summary.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewSummaryComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  chartMerge$ = this.overviewService.chartMerge$;
  searchKpiObjectiveCriteria = searchKpiObjectiveCriteria;
  uxTestsKpiObjectiveCriteria = uxTestsKpiObjectiveCriteria;
  feedbackKpiObjectiveCriteria = feedbackKpiObjectiveCriteria;

  currentCallVolume$ = this.overviewService.currentCallVolume$;

  loaded$ = this.overviewService.loaded$;
  loading$ = this.overviewService.loading$;
  error$ = this.overviewService.error$;

  apex$ = this.overviewService.apex$;

  currentKpiFeedback$ = this.overviewService.currentKpiFeedback$;
  kpiFeedbackPercentChange$ = this.overviewService.kpiFeedbackPercentChange$;
  kpiFeedbackDifference$ = this.overviewService.kpiFeedbackDifference$;

  kpiUXTestsPercent$ = this.overviewService.kpiUXTestsPercent$;
  kpiUXTestsTotal$ = this.overviewService.kpiUXTestsTotal$;

  kpiSearchAssessment$ = this.overviewService.currentKpiSearchAssessment$;
  kpiSearchAssessmentPercentChange$ =
    this.overviewService.kpiSearchAssessmentPercentChange$;
  kpiSearchAssessmentPassed$ = this.overviewService.searchAssessmentPassed$;

  uniqueVisitors$ = this.overviewService.visitors$;
  uniqueVisitorsPercentChange$ = this.overviewService.visitorsPercentChange$;

  visits$ = this.overviewService.visits$;
  visitsPercentChange$ = this.overviewService.visitsPercentChange$;

  apexCallDrivers$ = this.overviewService.apexCallDrivers$;
  apexKpiFeedback$ = this.overviewService.apexKpiFeedback$;

  callPerVisits$ = this.overviewService.callPerVisits$;
  callComparisonPerVisits$ = this.overviewService.callComparisonPerVisits$;
  apexCallPercentChange$ = this.overviewService.apexCallPercentChange$;
  apexCallDifference$ = this.overviewService.apexCallDifference$;

  pageViews$ = this.overviewService.views$;
  pageViewsPercentChange$ = this.overviewService.viewsPercentChange$;

  gscImpressions$ = this.overviewService.impressions$;
  gscImpressionsPercentChange$ = this.overviewService.impressionsPercentChange$;

  gscCTR$ = this.overviewService.ctr$;
  gscCTRPercentChange$ = this.overviewService.ctrPercentChange$;

  gscAverage$ = this.overviewService.avgRank$;
  gscAveragePercentChange$ = this.overviewService.avgRankPercentChange$;

  dyfChart$ = this.overviewService.dyfData$;
  dyfChartApex$ = this.overviewService.dyfDataApex$;
  whatWasWrongChart$ = this.overviewService.whatWasWrongData$;

  barChartData$ = this.overviewService.visitsByDay$;
  calldriversChartData$ = this.overviewService.calldriversByDay$;

  barTable$ = this.overviewService.tableMerge$;

  dateRangeLabel$ = this.overviewService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.overviewService.comparisonDateRangeLabel$;

  isChartDataOver31Days$ = this.overviewService.isChartDataOver31Days$;
  dyfChartLegend: string[] = [];
  langLink = 'en';
  chartCols: ColumnConfig = { field: '', header: '' };
  chartData: { text: string; link: string }[] = [];
  donutChartCols: ColumnConfig = { field: '', header: '' };
  donutChartData: { text: string; link: string }[] = [];

  yAxisVisits = '';
  yAxisCallVolume = '';
  whatWasWrongChartLegend: string[] = [];
  whatWasWrongChartApex$ = this.overviewService.whatWasWrongDataApex$;

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  dyfTableCols: ColumnConfig<{ name: string; value: string }>[] = [];
  whatWasWrongTableCols: ColumnConfig<{ name: string; value: string }>[] = [];
  barTableCols: ColumnConfig<{
    name: string;
    currValue: string;
    callCurrValue: string;
    prevValue: string;
    callPrevValue: string;
    prevName: string;
  }>[] = [];
  taskSurveyCols: ColumnConfig[] = [];

  ngOnInit() {
    combineLatest([
      this.currentLang$,
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
    ]).subscribe(([lang, dateRange, comparisonDateRange]) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';

      this.dyfChartLegend = [
        this.i18n.service.translate('yes', lang),
        this.i18n.service.translate('no', lang),
      ];
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

      this.whatWasWrongChartLegend = [
        this.i18n.service.translate('d3-cant-find-info', lang),
        this.i18n.service.translate('d3-other', lang),
        this.i18n.service.translate('d3-hard-to-understand', lang),
        this.i18n.service.translate('d3-error', lang),
      ];

      this.yAxisVisits = this.i18n.service.translate('visits', lang);
      this.yAxisCallVolume = this.i18n.service.translate('Call volume', lang);

      this.dyfChartLegend = [
        this.i18n.service.translate('yes', lang),
        this.i18n.service.translate('no', lang),
      ];
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
          field: 'callCurrValue',
          header: this.i18n.service.translate('Calls for ', lang, {
            value: dateRange,
          }),
          pipe: 'number',
        },
        {
          field: 'prevName',
          header: this.i18n.service.translate('Dates', lang),
        },
        {
          field: 'prevValue',
          header: this.i18n.service.translate('Visits for ', lang, {
            value: comparisonDateRange,
          }),
          pipe: 'number',
        },
        {
          field: 'callPrevValue',
          header: this.i18n.service.translate('Calls for ', lang, {
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

      this.chartCols = {
        field: 'text',
        header: 'secondaryTitle',
        type: 'link',
        typeParams: {
          preLink: '/' + this.langLink + '/overview/',
          link: 'link',
        },
      } as ColumnConfig;

      this.chartData = [
        {
          text: this.i18n.service.translate('View more traffic data', lang),
          link: 'webtraffic',
        },
        {
          text: this.i18n.service.translate(
            'View more call drivers data',
            lang
          ),
          link: 'calldrivers',
        },
      ];

      this.donutChartCols = {
        field: 'text',
        header: 'secondaryTitle',
        type: 'link',
        typeParams: {
          preLink: '/' + this.langLink + '/overview/',
          link: 'link',
        },
      } as ColumnConfig;

      this.donutChartData = [
        {
          text: this.i18n.service.translate(
            'View more page feedback data',
            lang
          ),
          link: 'pagefeedback',
        },
      ];
    });
  }
}
