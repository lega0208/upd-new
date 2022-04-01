import { Component, Input, OnInit } from '@angular/core';
import {
  formatLabel,
  escapeLabel,
  Color,
  ScaleType,
  LegendPosition,
  SingleSeries,
  MultiSeries,
} from '@amonsour/ngx-charts';
import dayjs from 'dayjs';
import { CurveFactory } from 'd3-shape';
import localeData from 'dayjs/plugin/localeData';
import { curves, Curves, ChartTypes } from './types';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css'],
})
export class ChartsComponent implements OnInit {
  view?: [number, number];
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() animations = true;
  @Input() type: ChartTypes = 'pie';
  @Input() width = 1020;
  @Input() height = 400;
  @Input() fitContainer = true;
  @Input() gradient = false;
  @Input() displayLegend = 'below';
  @Input() colour: string[] = ['#2E5EA7', '#64B5F6', '#26A69A', '#FBC02D'];
  @Input() showLegend = true;
  @Input() data: any = [];
  @Input() legendTitle = 'Legend';
  @Input() tooltipDisabled = false;
  @Input() showLabels = false;
  @Input() explodeSlices = false;
  @Input() arcWidth = 0.25;
  @Input() showXAxis = true;
  @Input() showYAxis = true;
  @Input() showXAxisLabel = true;
  @Input() xAxisLabel = 'Days of Week';
  @Input() showYAxisLabel = true;
  @Input() yAxisLabel = 'Visits (in thousands)';
  @Input() showGridLines = true;
  @Input() barPadding = 6;
  @Input() groupPadding = 12;
  @Input() roundDomains = false;
  @Input() showSeriesOnHover = true;
  @Input() roundEdges = false;
  @Input() xScaleMin!: number;
  @Input() xScaleMax!: number;
  @Input() showDataLabel = false;
  @Input() noBarWhenZero = false;
  @Input() rotateXAxisTicks = true;
  @Input() yAxisColourLeft = '';
  @Input() yAxisColourRight = '#f37d35';
  @Input() showRightYAxisLabel = true;
  @Input() yAxisLabelRight = 'Call volume (in thousands)';
  @Input() lineColour = ['#f37d35', '#fbbc4d'];
  @Input() barColour = ['#2E5EA7', '#B5C2CC'];
  @Input() trimXAxisTicks = true;
  @Input() trimYAxisTicks = true;
  @Input() maxXAxisTickLength = 16;
  @Input() maxYAxisTickLength = 16;
  @Input() yScaleMax!: number;
  @Input() yScaleMin = 0;
  @Input() curveType: Curves = 'Linear';
  @Input() rangeFillOpacity = 0.15;
  @Input() autoScale = false;
  @Input() timeline = false;

  // gauge
  @Input() gaugeData: any[] = [];
  @Input() gaugeMin = 0;
  @Input() gaugeMax = 100;
  @Input() gaugeLargeSegments = 2;
  @Input() gaugeSmallSegments = 0;
  @Input() gaugeTextValue = '';
  @Input() gaugeUnits = '';
  @Input() gaugeAngleSpan = 180;
  @Input() gaugeStartAngle = -90;
  @Input() gaugeShowAxis = true;
  @Input() gaugeValue = 50; // linear gauge value
  @Input() gaugePreviousValue = 70;
  @Input() showText = true;

  // margin
  @Input() margin = true;
  @Input() marginTop = 40;
  @Input() marginRight = 40;
  @Input() marginBottom = 40;
  @Input() marginLeft = 40;

  // combo data
  @Input() barChart: SingleSeries | MultiSeries | null = [];
  @Input() lineChart: SingleSeries | MultiSeries | null = [];
  colorLabelDefault = 'black';
  lineChartScheme!: Color;
  comboBarScheme!: Color;
  curve?: CurveFactory;

  colorScheme!: Color;
  legendPosition!: LegendPosition;

  // pie/donut
  doughnut = false;

  chartData: SingleSeries | MultiSeries | null = [];
  chartDataCols: any = [];

  ngOnInit(): void {
    this.setLegendPosition();
    if (this.type === 'combo-bar-line') this.setComboColourScheme();
    else this.setColourScheme();
    this.setDoughnut();
    this.setCurve();

    if (!this.fitContainer) {
      this.applyDimensions();
    }

    this.lineChart = lineChart;

    //const chartDataHeaders = Object.keys(this.chartData[0]);
    // console.log(Object.values(this.chartData[2])[0]);
    // console.log(chartDataHeaders);

    this.chartData = this.parseDataForChartData(this.data);

    this.chartDataCols = [
      { field: 'header', header: 'Date' },
      { field: 'name', header: this.xAxisLabel },
      { field: 'value', header: this.yAxisLabel },
    ];

    console.log(this.chartData);
  }

  applyDimensions() {
    this.view = [this.width, this.height];
  }

  setDoughnut() {
    if (this.type === 'doughnut' || this.type === 'donut') {
      this.doughnut = true;
    }
  }

  setLegendPosition() {
    if (this.displayLegend === 'below') {
      this.legendPosition = LegendPosition.Below;
    } else {
      this.legendPosition = LegendPosition.Right;
    }
  }

  setCurve() {
    this.curve = curves[this.curveType] as CurveFactory;
  }

  setColourScheme() {
    this.colorScheme = {
      group: ScaleType.Ordinal,
      name: 'daScheme',
      selectable: true,
      domain: this.colour,
    };
  }

  setComboColourScheme() {
    const mergedColours = [...this.barColour, ...this.lineColour];

    this.lineChartScheme = {
      name: 'cool',
      selectable: true,
      group: ScaleType.Ordinal,
      domain: mergedColours,
    };

    this.comboBarScheme = {
      name: 'daScheme',
      selectable: true,
      group: ScaleType.Ordinal,
      domain: this.barColour,
    };
  }

  pieTooltipText({ data }: any) {
    const label = formatLabel(data.name);
    const val = formatLabel(data.value);

    return `
      <span class="tooltip-label">${escapeLabel(label)}</span>
      <span class="tooltip-val">${val}</span>
    `;
  }

  yLeftAxisScale(min: number, max: number) {
    return { min: `${min}`, max: `${max}` };
  }

  yRightAxisScale(min: number, max: number) {
    return { min: `${min}`, max: `${max}` };
  }

  yLeftTickFormat(data: number) {
    return (data / 1000).toLocaleString();
  }

  yRightTickFormat(data: number) {
    return (data / 1000).toLocaleString();
  }

  xAxisTickFormat(data: number) {
    return (data / 1000).toLocaleString();
  }

  yAxisTickFormat(data: number) {
    return (data / 1000).toLocaleString();
  }

  getGaugeMin() {
    return this.gaugeMin;
  }

  getGaugeMax() {
    return this.gaugeMax;
  }

  axisTickFormat(data: number) {
    return data + '%';
  }

  valueFormat(data: number) {
    return data + '%'; // + this.gaugeMax// + '-' + this.getGaugeMax();
  }

  onSelect(event: any) {
    console.log(event);
  }

//   dataMultiSeriesToChartData(data: MultiSeries): any {
//     return data.map((d: any) => {
//         return {
//           name: d.name,
//           value: d.value,
//         };
//     });
//   }

// dataSingleSeriesToChartData(data: SingleSeries) {
//   return data.map((d: any) => {
//       return {
//         name: d.name,
//         value: d.value,
//       };
//   })
// }

parseDataForChartData = (data: MultiSeries): any => {
  return data.map((d: { series: any[]; name: any; }) => {
    return d.series.map((s) => ({
        header: d.name,
        name: s.name,
        value: s.value,
      }));
  })
  .flat();
};

}

// to be removed once gotten data for line

const lineChart = [
  {
    name: 'Calls Apr 18-Apr 24',
    series: [
      { name: 'Sunday', value: 0 },
      { name: 'Monday', value: 79917 },
      { value: 81278, name: 'Tuesday' },
      { name: 'Wednesday', value: 76967 },
      { value: 72542, name: 'Thursday' },
      { name: 'Friday', value: 65486 },
      { value: 2953, name: 'Saturday' },
    ],
  },
  {
    name: 'Calls Apr 11-Apr 17',
    series: [
      { name: 'Sunday', value: 0 },
      { name: 'Monday', value: 89599 },
      { value: 82338, name: 'Tuesday' },
      { name: 'Wednesday', value: 83349 },
      { value: 75687, name: 'Thursday' },
      { name: 'Friday', value: 69901 },
      { value: 0, name: 'Saturday' },
    ],
  },
];
