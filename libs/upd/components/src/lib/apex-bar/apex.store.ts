import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  filter,
  tap,
  map,
  withLatestFrom,
  pairwise,
  skip,
  take,
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
  ChartType,
} from 'ng-apexcharts';

import fr from 'apexcharts/dist/locales/fr.json';
import en from 'apexcharts/dist/locales/en.json';
import { EN_CA } from '@dua-upd/upd/i18n';
import { state } from '@angular/animations';
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
  added?: {
    type?: string;
    isPercent?: boolean;
  };
}

@Injectable()
export class ApexStore extends ComponentStore<ChartOptions> {
  constructor(private i18n: I18nFacade) {
    super({
      chart: {
        height: 375,
        type: 'bar',
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
        axisBorder: {
          show: true,
        },
        labels: {
          style: {
            fontSize: '14px',
          },
        },
      },
      yaxis: {
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
            // if (val >= 10 ** 3 && val < 10 ** 6) {
            //   return (val / 1000).toFixed(0) + ' K';
            // } else if (val >= 10 ** 6) {
            //   return (val / 1000000).toFixed(0) + ' M';
            // }

            // return val.toString();

            return val.toLocaleString(this.i18n.service.currentLang, {
              maximumFractionDigits: 0,
            });
          },
        },
        title: {
          style: {
            fontSize: '16px',
          },
        },
      },

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
      dataLabels: {
        enabled: false,
      },
      series: [],
      legend: {
        show: true,
        showForSingleSeries: true,
        showForNullSeries: true,
        showForZeroSeries: true,
        position: 'bottom',
        fontSize: '14px',
        horizontalAlign: 'left',
      },
      added: {
        isPercent: false,
      },
    });
  }

  isPercent = false;

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
    (state, value: boolean): ChartOptions => {
      return {
        ...state,
        plotOptions: {
          ...state.plotOptions,
          bar: {
            ...state.plotOptions?.bar,
            distributed: true,
            horizontal: value,
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

  // if

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

  readonly showPercent = this.updater((state, value: boolean): ChartOptions => {
    if (value) {
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
          shared: false,
          x: {
            show: true,
          },
          y: {
            formatter: (value, { series, seriesIndex, dataPointIndex, w }) => {
              return `${formatPercent(
                value,
                this.i18n.service.currentLang
              )} success rate`;
            },
            title: {
              formatter: () => {
                return '';
              },
            },
          },
        },
      };
    }
    return state;
  });

  readonly isPercent$ = this.select((state) => state.added?.isPercent);

  readonly setLocale = this.updater(
    (state, value: string): ChartOptions => ({
      ...state,
      chart: {
        ...state.chart,
        defaultLocale: value === EN_CA ? 'en' : 'fr',
      },
    })
  );

  // // get type @Input from parent component
  // readonly setType = this.updater(
  //   (state, value: string): ChartOptions => ({
  //     ...state,
  //     added: {
  //       ...state.added,
  //       type: value,
  //     },
  //   })
  // );

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
