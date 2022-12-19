import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { I18nFacade } from '@dua-upd/upd/state';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexYAxis,
  ApexOptions,
} from 'ng-apexcharts';

import { EN_CA } from '@dua-upd/upd/i18n';
import { mergeDeepRight } from 'rambdax';
import { createBaseConfig } from '../apex-base/apex.config.base';

@Injectable()
export class ApexStore extends ComponentStore<ApexOptions> {
  constructor(private i18n: I18nFacade) {
    super(
      mergeDeepRight(
        createBaseConfig((val: number) =>
          val.toLocaleString(this.i18n.service.currentLang, {
            maximumFractionDigits: 0,
          })
        ),
        {
          toolbar: {
            offsetY: -1,
            offsetX: -103,
            tools: {
              download:
                '<span class="material-icons align-middle">download</span>',
            },
          },
          stroke: { width: [3, 3, 3, 3], curve: 'smooth', lineCap: 'square' },
          yaxis: [],
        } as ApexOptions
      )
    );
  }

  readonly setColours = this.updater(
    (state, value: string[]): ApexOptions => ({
      ...state,
      colors: value ? value : [],
    })
  );

  readonly setSeries = this.updater(
    (state, value: ApexAxisChartSeries): ApexOptions => {
      this.setYAxis(value);

      return {
        ...state,
        series: value ? value : [],
      };
    }
  );

  readonly setLocale = this.updater(
    (state, value: string): ApexOptions => ({
      ...state,
      chart: {
        ...state.chart,
        defaultLocale: value === EN_CA ? 'en' : 'fr',
      } as ApexChart,
    })
  );

  readonly setYAxis = this.updater(
    (state, value: ApexAxisChartSeries): ApexOptions => {
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
      if (value[0]?.data?.length > 7) {
        secondMax = firstDataSet.map((val) => Math.round(val / 5));
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
                offsetX: -10,
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
                offsetX: 10,
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
          return mergeDeepRight(yAxisOpt, {
            min: 0,
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
            },
            labels: {
              style: {
                fontSize: '14px',
              },
              formatter: (val: number) => {
                return val.toLocaleString(this.i18n.service.currentLang, {
                  maximumFractionDigits: 0,
                });
              },
            },
          })
        }),
        chart: {
          ...state.chart,
          type: state.chart?.type || 'line',
          toolbar: {
            ...state.chart?.toolbar,
            offsetX: value[0]?.data?.length > 31 ? -124 : -103,
          },
        },
        fill: {
          opacity: value[0]?.data?.length > 31 ? [1, 0.75, 1, 0.75] : 1,
        },
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
