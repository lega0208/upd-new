import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ChartComponent, ChartType } from 'ng-apexcharts';
import { ColumnConfig } from '../data-table-styles/types';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import { ChartOptions } from '../apex-charts/chartbuilder';
import { KpiObjectiveStatus } from '../data-card/data-card.component';
import { formatPercent } from '@angular/common';
import {
  defaultKpiObjectiveStatusConfig,
  defaultKpiObjectiveCriteria,
} from './kpi-objectives';
@Component({
  selector: 'upd-apex-radial-bar',
  templateUrl: './apex-radial-bar.component.html',
  styleUrls: ['./apex-radial-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApexRadialBarComponent implements OnInit, OnChanges {
  @ViewChild('chart', { static: false }) chart!: ChartComponent;
  @Input() secondaryTitleCols: ColumnConfig = { field: '', header: '' };
  @Input() secondaryTitleData: Record<string, number | string>[] = [];
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() current = 0;
  @Input() comparison = 0;
  @Input() labels: string[] = [];
  @Input() seriesLabel = 'visits';
  @Input() kpiObjectiveCriteria = defaultKpiObjectiveCriteria;
  @Input() modal = '';
  @Input() keyword = 'calls';
  type: ChartType = 'radialBar';

  chartOptions: Partial<ChartOptions> = {
    chart: {
      height: 350,
      type: this.type,
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
            fontFamily: 'Noto Sans',
            offsetY: -5,
          },
          value: {
            offsetY: -55,
            fontSize: '32px',
            fontWeight: 'bold',
            fontFamily: 'Noto Sans',
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
        breakpoint: 1592,
        options: {
          chart: {
            height: 300,
          },
        },
      },
    ],
  };

  constructor(private i18n: I18nFacade) {}

  ngOnInit(): void {}

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

        const seriesValue = (data: number) => {
          return `${formatPercent(Math.abs(this.current), locale)}`;
        };

        this.chartOptions = {
          ...this.chartOptions,
          series: [Math.abs(this.current * 100)],
          fill: { colors: [colour] },
          labels:
            this.labels.length === 1
              ? this.labels
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
                  color: colour,
                },
                value: {
                  ...this.chartOptions.plotOptions?.radialBar?.dataLabels
                    ?.value,
                  formatter: seriesValue,
                },
              },
            },
          },
        };
      });
    }
  }
}
