import type {
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
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  ApexStates,
  ApexStroke,
  ApexTheme,
  ApexTitleSubtitle,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartType,
} from 'ng-apexcharts';
import { ChartComponent } from 'ng-apexcharts';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import type { ColumnConfig } from '@dua-upd/types-common';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA, LocaleId } from '@dua-upd/upd/i18n';
import { KpiObjectiveStatus } from '../data-card/data-card.component';
import { formatPercent } from '@angular/common';
import {
  defaultKpiObjectiveStatusConfig,
  defaultKpiObjectiveCriteria,
} from './kpi-objectives';
import fr from 'apexcharts/dist/locales/fr.json';
import en from 'apexcharts/dist/locales/en.json';

type ChartOptions = {
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
  selector: 'upd-apex-radial-bar',
  templateUrl: './apex-radial-bar.component.html',
  styleUrls: ['./apex-radial-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApexRadialBarComponent implements OnChanges {
  private i18n = inject(I18nFacade);
  currentLangSignal = this.i18n.currentLang;

  @ViewChild('chart', { static: false }) chart!: ChartComponent;
  @Input() secondaryTitleCols: ColumnConfig = { field: '', header: '' };
  @Input() secondaryTitleData: Record<string, number | string>[] = [];
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() current = 0;
  @Input() comparison = 0;
  @Input() comparisonMode = 0;
  @Input() labels: string[] = [];
  @Input() seriesLabel = 'visits';
  @Input() kpiObjectiveCriteria = defaultKpiObjectiveCriteria;
  @Input() modal = '';
  @Input() keyword = 'calls';
  @Input() postValue = '';
  @Input() preLabel = '';
  @Input() valueLabel = 0;
  @Input() kpiText = '';
  @Input() improvedKpi = 0;
  type: ChartType = 'radialBar';

  chartOptions: Partial<ChartOptions> = {
    chart: {
      height: 350,
      type: this.type,
      locales: [fr, en],
      defaultLocale: 'en',
      // toolbar: {
      //   show: true,
      // },
    },
    stroke: {
      lineCap: 'round',
    },
    dataLabels: {
      enabled: true,
      formatter: function (value, { seriesIndex, dataPointIndex, w }) {
        return w.config.series[seriesIndex].name + ':  ' + value;
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        offsetY: -20,
        hollow: {
          margin: 0,
          size: '70%',
        },
        dataLabels: {
          show: true,
          name: {
            show: true,
            fontSize: '18px',
            fontWeight: 'default',
            fontFamily: 'Inter',
            offsetY: -5,
          },
          value: {
            offsetY: -55,
            fontSize: '32px',
            fontWeight: 'bold',
            fontFamily: 'Inter',
            color: '#333',
            formatter: function (val) {
              return val + '%';
            },
          },
        },
      },
    },
    responsive: [
      {
        breakpoint: 1600,
        options: {
          chart: {
            height: 300,
          },
          plotOptions: {
            radialBar: {
              dataLabels: {
                name: {
                  fontSize: '16px',
                },
                value: {
                  offsetY: -55,
                  fontSize: '26px',
                },
              },
            },
          },
        },
      },
      {
        breakpoint: 1400,
        options: {
          chart: {
            height: 250,
          },
          plotOptions: {
            radialBar: {
              dataLabels: {
                name: {
                  fontSize: '16px',
                },
                value: {
                  offsetY: -40,
                  fontSize: '26px',
                },
              },
            },
          },
        },
      },
      {
        breakpoint: 1300,
        options: {
          chart: {
            height: 200,
          },
          plotOptions: {
            radialBar: {
              dataLabels: {
                name: {
                  fontSize: '12px',
                },
                value: {
                  offsetY: -40,
                  fontSize: '20px',
                },
              },
            },
          },
        },
      },
      {
        breakpoint: 1100,
        options: {
          chart: {
            height: 170,
          },
          plotOptions: {
            radialBar: {
              dataLabels: {
                name: {
                  fontSize: '10px',
                },
                value: {
                  offsetY: -30,
                  fontSize: '20px',
                },
              },
            },
          },
        },
      },
      {
        breakpoint: 992,
        options: {
          chart: {
            height: 350,
          },
          plotOptions: {
            radialBar: {
              dataLabels: {
                name: {
                  fontSize: '18px',
                },
                value: {
                  offsetY: -55,
                  fontSize: '32px',
                },
              },
            },
          },
        },
      },
    ],
  };

  getTrendIconAndColor(diff: number): { iconName: string; color: string } {
    let iconName = '';
    let color = '';

    if (diff > 0) {
      iconName = 'arrow_upward';
      color = '#26A69A';
    } else if (diff < 0) {
      iconName = 'arrow_downward';
      color = '#DF2929';
    } else {
      iconName = '';
      color = '';
    }

    return { iconName, color };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['current'] || changes['comparison'] || changes['labels']) {
      this.i18n.currentLang$.subscribe((lang) => {
        const locale = lang === EN_CA ? 'en' : 'fr';

        let kpi: KpiObjectiveStatus = 'none';
        let colour = '#000000';
        kpi =
          typeof this.current === 'number'
            ? this.kpiObjectiveCriteria(this.current, this.comparison || 0)
            : 'none';
        colour = defaultKpiObjectiveStatusConfig[kpi].colour || '';
        const current = typeof this.current === 'number' ? this.current : 0;
        const comparison =
          typeof this.comparison === 'number'
            ? formatPercent(this.comparison, locale) || '0'
            : '0';

        const postValueFunction = (data: number) => {
          return this.postValue
            ? `${formatPercent(
                data / 100,
                locale,
              )} ${this.i18n.service.translate(
                this.postValue,
                (locale + '-CA') as LocaleId,
              )}`
            : `${formatPercent(data / 100, locale)}`;
        };

        this.chartOptions = {
          ...this.chartOptions,
          series: [Math.abs(this.current * 100)],
          fill: { colors: [colour] },
          labels:
            this.labels.length === 1
              ? this.labels
              : this.preLabel && this.valueLabel
                ? [
                    `${this.i18n.service.translate(
                      this.preLabel,
                      (locale + '-CA') as LocaleId,
                    )} ${formatPercent(this.valueLabel, locale)}`,
                  ]
                : this.comparison !== 0
                  ? [comparison]
                  : [''],
          plotOptions: {
            radialBar: {
              ...this.chartOptions.plotOptions?.radialBar,
              dataLabels: {
                ...this.chartOptions.plotOptions?.radialBar?.dataLabels,
                name: {
                  ...this.chartOptions.plotOptions?.radialBar?.dataLabels?.name,
                  color: 'black',
                },
                value: {
                  ...this.chartOptions.plotOptions?.radialBar?.dataLabels
                    ?.value,
                  formatter: postValueFunction,
                },
              },
            },
          },
        };
      });
    }
  }
}
