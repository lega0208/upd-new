import {
  ApexAnnotations,
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexForecastDataPoints,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexNoData,
  ApexNonAxisChartSeries, ApexOptions,
  ApexPlotOptions,
  ApexResponsive,
  ApexStates,
  ApexStroke,
  ApexTheme,
  ApexTitleSubtitle,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
  ChartType
} from 'ng-apexcharts';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ColumnConfig } from '../data-table-styles/types';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import {
  comparisonStyling,
  KpiObjectiveStatus,
  KpiObjectiveStatusConfig,
  KpiOptionalConfig,
} from '../data-card/data-card.component';
import { formatPercent } from '@angular/common';
import {
  defaultKpiObjectiveStatusConfig,
  defaultKpiObjectiveCriteria,
} from '../apex-radial-bar/kpi-objectives';
import fr from 'apexcharts/dist/locales/fr.json';
import en from 'apexcharts/dist/locales/en.json';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';

dayjs.extend(utc);

export type ChartOptions = {
  annotations?: ApexAnnotations;
  chart?: ApexChart;
  colors?: string[];
  dataLabels?: ApexDataLabels;
  fill?: ApexFill;
  forecastDataPoints?: ApexForecastDataPoints;
  grid?: ApexGrid;
  labels?: string[];
  legend?: ApexLegend;
  markers?: ApexMarkers;
  noData?: ApexNoData;
  plotOptions?: ApexPlotOptions;
  responsive?: ApexResponsive[];
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  states?: ApexStates;
  stroke?: ApexStroke;
  subtitle?: ApexTitleSubtitle;
  theme?: ApexTheme;
  title?: ApexTitleSubtitle;
  tooltip?: ApexTooltip;
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis | ApexYAxis[];
};
@Component({
  selector: 'upd-apex-spark-line',
  templateUrl: './apex-spark-line.component.html',
  styleUrls: ['./apex-spark-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApexSparkLineComponent implements OnChanges {
  @ViewChild('chart', { static: false }) chart!: ChartComponent;
  @Input() secondaryTitleCols: ColumnConfig = { field: '', header: '' };
  @Input() secondaryTitleData: Record<string, number | string>[] = [];
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() current = 0;
  @Input() comparison = 0;
  @Input() labels: string[] = [''];
  @Input() seriesLabel = 'visits';
  @Input() kpiObjectiveCriteria = defaultKpiObjectiveCriteria;
  @Input() modal = '';
  @Input() keyword = 'calls';
  @Input() series: ApexAxisChartSeries = [];
  @Input() scale = 100;
  type: ChartType = 'line';

  chartOptions: Partial<ApexOptions> = {
    chart: {
      type: 'line',
      sparkline: {
        enabled: true,
      },
      height: 50,
      offsetY: 25,
      locales: [fr, en],
      defaultLocale: 'en',
    },
    stroke: {
      curve: 'smooth',
      width: 1.8,
    },
    xaxis: {
      type: 'datetime',
    },
    tooltip: {
      fixed: {
        enabled: false,
      },
      x: {
        show: true,
      },
      inverseOrder: true,
    },
  };
  curr = '';
  @Input() kpiStylesConfig: KpiOptionalConfig = {};
  @Input() difference = 0;
  diff = '';

  constructor(private i18n: I18nFacade) {}

  get kpiObjectiveStatus() {
    return typeof this.current === 'number'
      ? this.kpiObjectiveCriteria(this.current, this.comparison || 0)
      : 'none';
  }

  get kpiConfig(): KpiObjectiveStatusConfig {
    const mergedConfig = { ...defaultKpiObjectiveStatusConfig };

    // merge any provided config options with defaults
    for (const key of Object.keys(
      this.kpiStylesConfig
    ) as KpiObjectiveStatus[]) {
      mergedConfig[key] = {
        ...mergedConfig[key],
        ...this.kpiStylesConfig[key],
      };
    }

    return mergedConfig;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['current'] || changes['comparison'] || changes['series']) {
      this.i18n.currentLang$.subscribe((lang) => {
        const locale = lang === EN_CA ? 'en' : 'fr';

        this.diff = (this.difference * this.scale).toLocaleString(lang, {
          minimumFractionDigits: 1, maximumFractionDigits: 2
        });

        const colour = this.kpiConfig[this.kpiObjectiveStatus].colour as string;

        this.curr = Math.abs(this.current * this.scale).toLocaleString(locale, {
          maximumFractionDigits: 1,
        });

        const seriesValue = (data: number) => {
          return `${Math.abs(this.current * 100).toLocaleString(locale, {
            maximumFractionDigits: 1,
          })}`;
        };
        const dateFormat = lang === EN_CA ? 'MMM D' : 'D MMM';

        //     this.chartOptions = {
        //       ...this.chartOptions,
        //       series: [Math.abs(this.comparison * 100)],
        //       fill: { colors: [colour] },
        //       labels: this.comparison !== 0 ? [comparison] : [''],
        //       plotOptions: {
        //         radialBar: {
        //           ...this.chartOptions.plotOptions?.radialBar,
        //           dataLabels: {
        //             ...this.chartOptions.plotOptions?.radialBar?.dataLabels,
        //             name: {
        //               ...this.chartOptions.plotOptions?.radialBar?.dataLabels?.name,
        //               color: colour,
        //             },
        //             value: {
        //               ...this.chartOptions.plotOptions?.radialBar?.dataLabels
        //                 ?.value,
        //               formatter: seriesValue,
        //             },
        //           },
        //         },
        //       },
        //     };
        //   });
        // }

        this.chartOptions = {
          ...this.chartOptions,
          series: this.series,
          colors: ['#DEDEDE', colour],
          labels: this.labels,
          tooltip: {
            ...this.chartOptions.tooltip,
            y: {
              ...this.chartOptions.tooltip?.y,
              formatter: (val: number) => {
                return val.toLocaleString(locale, {
                  maximumFractionDigits: 2,
                });
              },
            },
            x: {
              ...this.chartOptions.tooltip?.x,
              formatter: (val: number) => {
                return dayjs.utc(val).locale(lang).format(dateFormat);
              }
            }
          },
        };
      });
    }
  }
}
