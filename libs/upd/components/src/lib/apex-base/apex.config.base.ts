/*
 * Base Apex config for charts
 */
import { ApexChart, ApexOptions, ApexYAxis } from 'ng-apexcharts';
import fr from 'apexcharts/dist/locales/fr.json';
import en from 'apexcharts/dist/locales/en.json';

export const createBaseConfig = (formatter: (val: number) => string) => ({
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
    type: 'bar',
    locales: [fr, en],
    defaultLocale: 'en',
    fontFamily: 'Noto Sans',
    toolbar: {
      tools: {
        download: '<span class="material-icons align-middle">download</span>',
      },
    },
  } as ApexChart,
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
  fill: {
    type: 'solid',
    opacity: 1,
  },
  stroke: {
    width: 3,
    curve: 'smooth',
    lineCap: 'round',
  },
  xaxis: {
    type: 'datetime',
    labels: {
      style: {
        fontSize: '14px',
      },
      hideOverlappingLabels: true
    },
    axisBorder: {
      show: true,
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
      formatter,
    },
    title: {
      style: {
        fontSize: '16px',
      },
      offsetX: -10
    },
  } as ApexYAxis,
  tooltip: {
    enabled: true,
    shared: true,
    intersect: false,
    y: {
      formatter,
    },
    style: {
      fontSize: '14px',
    },
  },
  series: [],
  dataLabels: {
    enabled: false,
  },
} as ApexOptions)
