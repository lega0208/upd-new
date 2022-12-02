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
  yaxis?: ApexYAxis | ApexYAxis[];
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
      legend: {
        show: true,
        showForSingleSeries: true,
        showForNullSeries: true,
        showForZeroSeries: true,
        position: 'bottom',
        fontSize: '14px',
        horizontalAlign: 'left',
        markers: {
          strokeWidth: 0.5,
          width: 20,
          height: 20,
          radius: 5,
          offsetY: 5,
        },
      },
      chart: {
        height: 375,
        type: 'line',
        locales: [fr, en],
        defaultLocale: 'en',
        toolbar: {
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
      xaxis: {
        type: 'datetime',
        title: {
          style: {
            fontSize: '14px',
          },
        },
        axisBorder: {
          show: true,
        },
      },
      yaxis: [],
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) => {
            return val.toLocaleString(this.i18n.service.currentLang, {
              maximumFractionDigits: 0,
            });
          },
        },
        style: {
          fontSize: '14px',
        },
      },
      stroke: { width: [0, 0, 3, 3], curve: 'smooth' },
      series: [],
      dataLabels: {
        enabled: false,
      },
    });
  }

  readonly setColours = this.updater(
    (state, value: string[]): ChartOptions => ({
      ...state,
      colors: value ? value : [],
    })
  );

  readonly setSeries = this.updater(
    (state, value: ApexAxisChartSeries): ChartOptions => {
      this.setYAxis(value);
      console.log('setSeries', value);
      if (value[0]?.data?.length > 31) {
        value[0].type = 'line';
        value[1].type = 'line';
        return {
          ...state,
          series: value ? value : [],
          stroke: { width: [3, 3, 3, 3], curve: 'smooth' },
        };
      }
      return {
        ...state,
        series: value ? value : [],
        stroke: { width: [0, 0, 3, 3], curve: 'smooth' },
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

  readonly setYAxis = this.updater(
    (state, value: ApexAxisChartSeries): ChartOptions => {
      const firstDataSet: number[] = [0, 1]
        .map((p: number) => {
          return value[p].data;
        })
        .reduce((a: any, b: any) => {
          return a.concat(b);
        }, [])
        .map((d: any) => {
          return d?.y;
        });

      const secondDataSet: number[] = [2, 3]
        .map((p: number) => {
          return value[p].data;
        })
        .reduce((a: any, b: any) => {
          return a.concat(b);
        }, [])
        .map((d: any) => {
          return d?.y;
        });

      let secondMax = secondDataSet;
      if (value[0]?.data?.length > 31) {
        secondMax = firstDataSet;
      }
      return {
        ...state,
        yaxis: value.map((s, i) => {
          let yAxisOpt: ApexYAxis = {};
          if (i === 0) {
            yAxisOpt = {
              seriesName: value[0].name,
              title: {
                text: this.i18n.service.translate(
                  'visits',
                  this.i18n.service.currentLang
                ),
                style: {
                  fontSize: '16px',
                },
              },
              max: getMax(firstDataSet),
              tickAmount: 5,
            };
          } else if (i === 1) {
            yAxisOpt = {
              show: false,
              seriesName: value[0].name,
            };
          } else if (i === 2) {
            yAxisOpt = {
              title: {
                text: this.i18n.service.translate(
                  'Call volume',
                  this.i18n.service.currentLang
                ),
                style: {
                  fontSize: '16px',
                  color: '#f37d35',
                },
              },
              labels: {
                style: {
                  colors: ['#f37d35'],
                },
              },
              opposite: true,
              max: getMax(secondMax),
              seriesName: value[2].name,
              tickAmount: 5,
            };
          } else if (i === 3) {
            yAxisOpt = {
              opposite: true,
              show: false,
              seriesName: value[2].name,
            };
          }
          return {
            ...yAxisOpt,
            min: 0,
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
            },
            labels: {
              ...yAxisOpt.labels,
              style: {
                ...yAxisOpt.labels?.style,
                fontSize: '14px',
              },
              formatter: (val: number) => {
                return val.toLocaleString(this.i18n.service.currentLang, {
                  maximumFractionDigits: 0,
                });
              },
            },
          };
        }),
      };
    }
  );

  readonly vm$ = this.select(this.state$, (state) => state);
}

export function getMax(values: number[]): number {
  const max = Math.max(...values);

  const digits = Math.floor(Math.log10(max)) + 1;
  return Math.ceil(max / Math.pow(10, digits - 1)) * Math.pow(10, digits - 1);
}
