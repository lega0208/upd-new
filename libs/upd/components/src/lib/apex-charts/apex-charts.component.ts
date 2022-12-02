import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ApexAnnotations,
  ApexAxisChartSeries,
  ApexChart,
  ApexNonAxisChartSeries,
  ApexTitleSubtitle,
  ApexXAxis,
  ChartComponent,
  ChartType,
} from 'ng-apexcharts';
import fr from 'apexcharts/dist/locales/fr.json';
import en from 'apexcharts/dist/locales/en.json';
import { ColumnConfig } from '../data-table-styles/types';
import { EN_CA } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { ApexChartBuilder } from './chartbuilder';
import {
  KpiObjectiveCriteria,
  KpiObjectiveStatus,
  KpiObjectiveStatusConfig,
} from '../data-card/data-card.component';
import { yAxisOptions } from './chartbuilder';
import { formatPercent } from '@angular/common';

export const defaultKpiObjectiveCriteria: KpiObjectiveCriteria = (
  current,
  comparison: number
) => {
  switch (true) {
    case current < 0.7:
      return 'fail';
    case current >= 0.7 && comparison >= 0.1:
      return 'fail';
    case current >= 0.7 && comparison >= 0.05 && comparison < 0.1:
      return 'partial';
    case current >= 0.7 && comparison < 0.05:
      return 'pass';
    default:
      return 'none';
  }
};

const defaultKpiObjectiveStatusConfig: KpiObjectiveStatusConfig = {
  pass: {
    colour: '#26A69A',
    iconName: 'check_circle',
    message: 'kpi-met',
  },
  fail: {
    colour: '#DF2929',
    iconName: 'warning',
    message: 'kpi-not-met',
  },
  partial: {
    colour: '#F57F17',
    iconName: 'check_circle',
    message: 'kpi-half-met',
  },
  none: {
    colour: 'hidden',
    iconName: '',
    message: '',
  },
};

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'upd-apex-charts',
  templateUrl: './apex-charts.component.html',
  styleUrls: ['./apex-charts.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ApexChartsComponent implements OnInit, OnChanges {
  @ViewChild('chart', { static: false }) chart!: ChartComponent;
  chartOptions: Partial<ChartOptions> | any;

  @Input() secondaryTitleCols: ColumnConfig = { field: '', header: '' };
  @Input() secondaryTitleData: Record<string, number | string>[] = [];
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() data: any = [];
  @Input() table: any;
  @Input() tableCols: ColumnConfig[] = [];
  lang!: string;
  langLink = 'en';
  currentLang$ = this.i18n.currentLang$;

  @Input() type: ChartType = 'line';
  @Input() chartOpt!: ApexChart;
  @Input() annotations!: ApexAnnotations;
  @Input() labels: string[] = [];
  @Input() yAxisOpt: yAxisOptions = [];
  @Input() titleOpt: string[] = ['visits', '', 'Call volume', ''];

  @Input() colors = [
    '#2E5EA7',
    '#64B5F6',
    '#26A69A',
    '#FBC02D',
    '#1DE9B6',
    '#F57F17',
    '#602E9C',
    '#2196F3',
    '#DE4CAE',
    '#C3680A',
    '#C5C5FF',
    '#1A8361',
  ];

  @Input() displayKpis = false;
  @Input() kpiObjectiveCriteria = defaultKpiObjectiveCriteria;

  @Input() current: number | null = null;
  @Input() comparison?: number | null;
  colour = '#000';

  constructor(private i18n: I18nFacade) {}

  ngOnInit() {
    this.currentLang$.subscribe((lang) => {
      this.lang = lang === EN_CA ? 'en' : 'fr';
    });

    this.data.subscribe(
      (series: ApexAxisChartSeries | ApexNonAxisChartSeries) => {
        this.getChart(series).then((chartOptions) => {
          this.chartOptions = chartOptions;
        });
      }
    );

    //this.chart?.updateOptions(this.chartOptions);
  }
  getChart(
    series: ApexAxisChartSeries | ApexNonAxisChartSeries
  ): Promise<ChartOptions> {
    let kpi: KpiObjectiveStatus = 'none';
    if (this.displayKpis) {
      kpi =
        typeof this.current === 'number'
          ? this.kpiObjectiveCriteria(this.current, this.comparison || 0)
          : 'none';

      this.colour = defaultKpiObjectiveStatusConfig[kpi].colour || '';
    } else {
      this.colour = '#000';
    }
    const height = this.type === 'radialBar' ? 350 : 375;
    const chartOpt = {
      height: height,
      type: this.type,
      locales: [fr, en],
      defaultLocale: 'en',
    };
    const chartBuilder = new ApexChartBuilder(this.lang);
    const current = typeof this.current === 'number' ? this.current : 0;
    const comparison =
      typeof this.comparison === 'number'
        ? formatPercent(this.comparison, this.lang) || '0'
        : '0';
    //console.log('comparison', comparison);

    if (this.type === 'donut') {
      this.chartOptions = chartBuilder
        .setChart(chartOpt, this.type)
        .setColors(this.colors)
        .setSeries(series)
        .setLabels(this.labels)
        .setPlotOptions(this.type)
        .build();
    } else if (this.type === 'radialBar') {
      this.chartOptions = chartBuilder
        .setChart(chartOpt, this.type)
        .setColors(this.colors)
        .setLabels([comparison])
        .setPlotOptions(this.type)
        .setFill({ colors: [this.colour] })
        .setSeries([current])
        .setStroke({ lineCap: 'round' })
        .setTooltip({})
        .setLegend({})
        .setDataLabels({ enabled: true })
        .build();
    } else {
      this.chartOptions = chartBuilder
        .setChart(chartOpt, this.type)
        .setAnnotations(this.annotations)
        .setColors(this.colors)
        .setLabels(this.labels)
        .setSeries(series)
        .setStroke({ width: [0, 0, 3, 3], curve: 'smooth' })
        // .setDataLabels({
        //   enabled: true,
        //   enabledOnSeries: [2, 3],
        //   formatter: (val: number) => {
        //     return val.toLocaleString('en-CA', { maximumFractionDigits: 0 });
        //   },
        // })
        .addYAxis(series, this.yAxisOpt, this.titleOpt)
        .build();
    }
    return Promise.resolve(this.chartOptions);
  }

  ngOnChanges(changes: SimpleChanges) {}

  // ngAfterViewInit() {
  //   this.chart.updateOptions(this.chartOptions);
  // }
}
