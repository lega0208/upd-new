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
import { LocaleNumberPipe, LocalePercentPipe } from '@dua-upd/upd/pipes';

export type yAxisOptions = {
  title?: string;
  visible?: boolean;
  opposite?: boolean;
  paired?: number[];
}[];

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

export class ApexChartBuilder {
  query: ChartOptions;
  yaxis: ApexYAxis | ApexYAxis[];
  emptyYaxis: ApexYAxis | ApexYAxis[];
  plotOptions: ApexPlotOptions;
  plotOptionsRadial: ApexPlotOptions = {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      hollow: {
        margin: 0,
        size: '70%',
      },
      dataLabels: {
        show: true,
        name: {
          show: true,
          fontSize: '16px',
          color: '#333',
        },
        value: {
          offsetY: -40,
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#333',
        },
      },
    },
  };

  constructor(lang: string) {
    this.query = {
      series: [],
      legend: {
        show: true,
        showForSingleSeries: true,
        position: 'bottom',
        fontSize: '14px',
        horizontalAlign: 'left',
      },
      xaxis: {
        type: 'datetime',
        title: {
          text: 'Days',
          style: {
            fontSize: '14px',
          },
        },
        axisBorder: {
          show: true,
        },
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) => {
            return val.toLocaleString(lang, { maximumFractionDigits: 0 });
          },
        },
      },
    };

    this.plotOptions = {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              //showAlways: true,
              show: true,
              color: '#333',
              formatter: function (w) {
                return w.globals.seriesTotals
                  .reduce((a: number, b: number) => {
                    return a + b;
                  }, 0)
                  .toLocaleString(lang, { maximumFractionDigits: 0 });
              },
            },
            value: {
              show: true,
              formatter: (val: string) => {
                return Number(val).toLocaleString(lang, {
                  maximumFractionDigits: 0,
                });
              },
            },
          },
        },
      },
    };

    this.yaxis = {
      seriesName: '',
      opposite: false,
      axisTicks: {
        show: true,
      },
      axisBorder: {
        show: true,
      },
      min: 0,
      labels: {
        style: {
          fontSize: '14px',
        },
        formatter: (val: number) => {
          return val.toLocaleString(lang, { maximumFractionDigits: 0 });
        },
      },
    };

    this.emptyYaxis = {
      seriesName: '',
      axisTicks: {
        show: true,
      },
      axisBorder: {
        show: false,
      },
      labels: {
        show: false,
      },
      title: {
        text: '',
      },
      tooltip: {
        enabled: false,
      },
    };
  }

  public setAnnotations(annotations: ApexAnnotations) {
    this.query.annotations = annotations;
    return this;
  }

  public setSeries(series: ApexAxisChartSeries | ApexNonAxisChartSeries) {
    this.query.series = series;
    return this;
  }

  public setChart(chart: ApexChart, type: ChartType) {
    this.query.chart = {
      ...chart,
      type: type,
    };

    if (type === 'radialBar') {
      this.query.chart = {
        ...this.query.chart,
        offsetY: -20,
      };
    }
    return this;
  }

  public setStroke(stroke: ApexStroke) {
    this.query.stroke = stroke;
    return this;
  }

  public setPlotOptions(type: ChartType) {
    if (type === 'donut') {
      this.query.plotOptions = this.plotOptions;
    } else if (type === 'radialBar') {
      this.query.plotOptions = this.plotOptionsRadial;
    }
    return this;
  }

  public setFill(fill: ApexFill) {
    this.query.fill = fill;
    return this;
  }

  public setDataLabels(dataLabels: ApexDataLabels) {
    this.query.dataLabels = dataLabels;
    return this;
  }

  public setColors(colors: string[]) {
    this.query.colors = colors;
    return this;
  }

  public setXaxis(xaxis: ApexXAxis) {
    this.query.xaxis = xaxis;
    return this;
  }

  public setYaxis(yaxis: ApexYAxis | ApexYAxis[]) {
    this.query.yaxis = yaxis;
    return this;
  }

  public setTooltip(tooltip: ApexTooltip) {
    this.query.tooltip = tooltip;
    return this;
  }

  public setLabels(labels: string[]) {
    this.query.labels = labels;
    return this;
  }

  public setLegend(legend: ApexLegend) {
    this.query.legend = legend;
    return this;
  }

  public addYAxis(
    series: ApexAxisChartSeries | ApexNonAxisChartSeries | any,
    options: {
      title?: string;
      visible?: boolean;
      opposite?: boolean;
      paired?: number[];
    }[],
    titleOptions: string[]
  ) {
    const yaxis: ApexYAxis | ApexYAxis[] = [];

    series.forEach(
      (s: ApexAxisChartSeries | ApexNonAxisChartSeries | any, i: number) => {
        let isVisible = true;
        const y: any = {
          seriesName: s.name,
        };

        if (options[i] !== undefined) {
          if (options[i].opposite) {
            y.opposite = options[i].opposite;
          }
          if (options[i].title) {
            y.title = {
              text: options[i].title,
              style: {
                fontSize: '16px',
              },
            };
          }
          if (options[i].paired) {
            const paired = options[i].paired || [];

            const p = paired
              .map((p: number) => {
                return series[p].data;
              })
              .reduce((a: string, b: string) => {
                return a.concat(b);
              }, [])
              .map((d: any) => {
                if (d !== undefined) {
                  return d.y;
                }
              }) as number[];

            y.max = getMax(p);
          }
          if (options[i].visible === false) {
            isVisible = false;
          }
        }

        if (isVisible) {
          yaxis.push({
            ...this.yaxis,
            ...y,
          });
        } else {
          yaxis.push({ ...this.emptyYaxis, ...y });
        }
      }
    );

    this.query.yaxis = yaxis;
    return this;
  }

  public build(): ChartOptions {
    console.log(this.query);
    return this.query;
  }
}

export function getMax(values: number[]) {
  const max = Math.max(...values);

  const digits = Math.floor(Math.log10(max)) + 1;
  return Math.ceil(max / Math.pow(10, digits - 1)) * Math.pow(10, digits - 1);
}
