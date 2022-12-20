import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { I18nFacade } from '@dua-upd/upd/state';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexOptions,
  ApexYAxis,
} from 'ng-apexcharts';

import { EN_CA } from '@dua-upd/upd/i18n';
import { formatPercent } from '@angular/common';
import { createBaseConfig } from '../apex-base/apex.config.base';

export interface ChartOptions extends ApexOptions {
  chart: ApexChart;
  yaxis?: ApexYAxis;
  added?: {
    type?: string;
    isPercent?: boolean;
  };
}

@Injectable()
export class ApexStore extends ComponentStore<ChartOptions> {
  constructor(private i18n: I18nFacade) {
    super({
      ...createBaseConfig((val: number) =>
        val.toLocaleString(this.i18n.service.currentLang, {
          maximumFractionDigits: 0,
        })
      ),
      added: {
        isPercent: false,
      },
    } as ChartOptions);
  }

  readonly setColours = this.updater(
    (state, value: string[]): ChartOptions => ({
      ...state,
      colors: value ? value : [],
    })
  );

  readonly setSeries = this.updater(
    (state, value: ApexAxisChartSeries): ChartOptions => {
      if (value[0]?.data?.length > 31) {
        return {
          ...state,
          chart: {
            ...state.chart,
            type: 'line',
          },
          series: value ? value : [],
          stroke: { width: [3, 3, 3, 3], curve: 'smooth' },
          fill: {
            opacity: [1, 0.8]
          }
        };
      }
      return {
        ...state,
        chart: {
          ...state.chart,
          type: 'bar',
        },
        series: value ? value : [],
        stroke: { width: [0, 0, 0, 0], curve: 'smooth' },
      };
    }
  );

  readonly setHorizontal = this.updater(
    (state, value: { isHorizontal: boolean, colorDistributed: boolean}): ChartOptions => {
      return {
        ...state,
        plotOptions: {
          ...state.plotOptions,
          bar: {
            ...state.plotOptions?.bar,
            distributed: value?.colorDistributed,
            horizontal: value?.isHorizontal,
          },
        },
      };
    }
  );

  readonly setXAxis = this.updater(
    (state, value: string[]): ChartOptions => ({
      ...state,
      xaxis: {
        ...state.xaxis,
        type: 'category',
        categories: value,
      },
    })
  );

  readonly getIsPercent = this.select((state) => state.added?.isPercent);

  readonly setYAxis = this.updater((state, value: string): ChartOptions => {
    return {
      ...state,
      yaxis: {
        ...state.yaxis,
        title: {
          ...state?.yaxis?.title,
          text: value,
        },
      },
    };
  });

  readonly showPercent = this.updater((state, value: { isPercent: boolean, showTitleTooltip: boolean, showMarker: boolean, shared: boolean}): ChartOptions => {
    if (value?.isPercent) {

      let titleTooltip = (seriesName: string) => {
        return seriesName;
      };
      
      if (!value?.showTitleTooltip) {
        titleTooltip = () => {
          return '';
        };
      }
      
      return {
        ...state,
        yaxis: {
          ...state.yaxis,
          min: 0,
          max: 1,

          tickAmount: 0,
        },
        xaxis: {
          ...state.xaxis,
          tickAmount: 5,

          labels: {
            ...state.xaxis?.labels,
            formatter: (val: string) => {
              return formatPercent(+val, this.i18n.service.currentLang);
            },
          },
        },
        tooltip: {
          ...state.tooltip,
          shared: value?.shared,
          marker: {
            show: value?.showMarker,
        },
          x: {
            show: true,
          },
          y: {
            
            formatter: (value, { series, seriesIndex, dataPointIndex, w }) => {
              if ( value === null || value === undefined) {
                return '-';
              }
              return `${formatPercent(
                value,
                this.i18n.service.currentLang
              )} ${this.i18n.service.translate('success rate', this.i18n.service.currentLang)}`;
            },
            title: {
              formatter: titleTooltip,
            },
            
          },
        },
      };
    }
    return state;
  });

  readonly setLocale = this.updater(
    (state, value: string): ChartOptions => ({
      ...state,
      chart: {
        ...state.chart,
        defaultLocale: value === EN_CA ? 'en' : 'fr',
      } as ApexChart,
    })
  );

  readonly type$ = this.select((state) => state.added?.type);

  readonly setLine = this.effect((type$: Observable<string>) => {
    return type$.pipe(
      tap((type) => {
        if (type === 'line') {
          this.setSeries([
            {
              name: 'Series 1',
              data: [31, 40, 28, 51, 42, 109, 100],
            },
          ]);
        }
      })
    );
  });

  readonly vm$ = this.select(this.state$, (state) => state);
}
