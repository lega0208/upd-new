import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  filter,
  tap,
  map,
  withLatestFrom,
  pairwise,
  skip,
} from 'rxjs/operators';
import { Observable } from 'rxjs';
import { I18nFacade } from '@dua-upd/upd/state';
import {
  ApexAnnotations,
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
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
} from 'ng-apexcharts';

import fr from 'apexcharts/dist/locales/fr.json';
import en from 'apexcharts/dist/locales/en.json';
import { EN_CA } from '@dua-upd/upd/i18n';
import { formatPercent } from '@angular/common';

export interface ChartOptions {
  chart: ApexChart;
  annotations?: ApexAnnotations;
  colors?: string[];
  dataLabels?: ApexDataLabels;
  series?: ApexAxisChartSeries | ApexNonAxisChartSeries;
  stroke?: ApexStroke;
  labels?: string[];
  legend?: ApexLegend;
  fill?: ApexFill;
  tooltip?: ApexTooltip;
  plotOptions?: ApexPlotOptions;
  responsive?: ApexResponsive[];
  markers?: ApexMarkers;
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis;
  grid?: ApexGrid;
  states?: ApexStates;
  title?: ApexTitleSubtitle;
  subtitle?: ApexTitleSubtitle;
  theme?: ApexTheme;
}

@Injectable()
export class ApexStore extends ComponentStore<ChartOptions> {
  constructor(private i18n: I18nFacade) {
    super({
      chart: {
        height: 375,
        type: 'donut',
        locales: [fr, en],
        defaultLocale: 'en',
        toolbar: {
          show: true,
          tools: {
            download: '<span class="material-icons">download</span>',
          },
        },
      },
      colors: [
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
      ],
      dataLabels: {
        enabled: true,
        formatter: (val: number) =>
          `${formatPercent(val / 100, this.i18n.service.currentLang)}`,
        style: {
          fontSize: '14px',
        },
        dropShadow: {
          enabled: true,
        },
        background: {
          enabled: true,
          foreColor: '#FFF',
          opacity: 0.0,
        },
      },
      plotOptions: {
        pie: {
          dataLabels: {
            minAngleToShowLabel: 0,
          },
          donut: {
            labels: {
              show: true,
              total: {
                showAlways: true,
                show: true,
                color: '#333',
                formatter: function (w) {
                  return w.globals.seriesTotals
                    .reduce((a: number, b: number) => {
                      return a + b;
                    }, 0)
                    .toLocaleString(i18n.service.currentLang, {
                      maximumFractionDigits: 0,
                    });
                },
              },
              value: {
                show: true,
                formatter: (val: string) => {
                  return Number(val).toLocaleString(i18n.service.currentLang, {
                    maximumFractionDigits: 0,
                  });
                },
              },
            },
          },
        },
      },
      tooltip: {
        enabled: true,
        custom: ({ series, seriesIndex, w }) => {
          return `<div class='apex-custom-tooltip'>
            <span>
            ${w.globals.labels[seriesIndex]}: ${series[
            seriesIndex
          ].toLocaleString(this.i18n.service.currentLang, {
            maximumFractionDigits: 0,
          })} (${formatPercent(
            w.globals.seriesPercent[seriesIndex] / 100,
            this.i18n.service.currentLang
          )})
            </span>
            </div>`;
        },
        style: {
          fontSize: '14px',
        },
      },
      series: [],
      legend: {
        show: true,
        showForSingleSeries: true,
        showForNullSeries: true,
        showForZeroSeries: true,
        onItemClick: {
          toggleDataSeries: false,
        },
        width: 175,
        fontSize: '14px',
      },
      responsive: [
        {
          breakpoint: 1250,
          options: {
            dataLabels: {
              enabled: false,
            },
          },
        },
      ],
    });
  }

  readonly setColours = this.updater(
    (state, value: string[]): ChartOptions => ({
      ...state,
      colors: value ? value : [],
    })
  );

  readonly setLabels = this.updater(
    (state, value: string[]): ChartOptions => ({
      ...state,
      labels: value ? value : [],
    })
  );

  readonly setSeries = this.updater(
    (state, value: ApexNonAxisChartSeries): ChartOptions => {
      return {
        ...state,
        series: value ? value : [],
      };
    }
  );

  readonly setLocale = this.updater(
    (state, value: string): ChartOptions => ({
      ...state,
      chart: {
        ...state.chart,
        defaultLocale: value === EN_CA ? 'en' : 'fr',
      },
    })
  );

  readonly vm$ = this.select(this.state$, (state) => state);
}
