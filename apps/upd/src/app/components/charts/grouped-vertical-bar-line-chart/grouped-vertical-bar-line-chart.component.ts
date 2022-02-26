import { Component, Input, OnInit } from '@angular/core';
import {
  ScaleType,
  LegendPosition,
  ColorHelper,
  Color,
} from '@lega0208/ngx-charts';
import { ApiService } from '../../../services/api/api.service';
import * as shape from 'd3-shape';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
dayjs.extend(localeData);

@Component({
  selector: 'app-grouped-vertical-bar-line-chart',
  templateUrl: './grouped-vertical-bar-line-chart.component.html',
  styleUrls: ['./grouped-vertical-bar-line-chart.component.scss'],
})
export class GroupedVerticalBarLineChartComponent implements OnInit {
  // data
  barChart: any = [];
  lineChart: any = [];

  //days of the week (Sunday to Saturday)
  week: string[] = dayjs.weekdays();

  // options

  // set view to [ width, height ] (if fitContainer is false)
  // this would be unresponsive
  view: any;
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() fitContainer = true;
  @Input() width = 1020;
  @Input() height = 400;
  @Input() showXAxis = true;
  @Input() showYAxis = true;
  @Input() gradient = false;
  @Input() showLegend = true;
  @Input() legendTitle = 'Legend';
  @Input() showXAxisLabel = true;
  @Input() tooltipDisabled = false;
  @Input() xAxisLabel = 'Days of Week';
  @Input() showYAxisLabel = true;
  @Input() yAxisLabel = 'Visits (in thousands)';
  @Input() showGridLines = true;
  @Input() barPadding = 6;
  @Input() groupPadding = 12;
  @Input() roundDomains = false;
  @Input() showSeriesOnHover = true;
  @Input() displayLegend = 'right';
  @Input() roundEdges = false;
  @Input() animations = true;
  @Input() xScaleMin: any;
  @Input() xScaleMax: any;
  @Input() showDataLabel = false;
  @Input() noBarWhenZero = false;
  @Input() rotateXAxisTicks = true;
  @Input() colorLabelLeft = '';
  @Input() colorLabelRight = '#f37d35';
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
  @Input() data = '';

  colorLabelDefault = 'black';
  lineChartScheme!: Color;
  comboBarScheme!: Color;
  legendPosition!: LegendPosition;
  curve: any;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.getData();
    this.setColourScheme();
    this.setLegendPosition();
    this.setCurve();

    if (!this.fitContainer) {
      this.applyDimensions();
    }
  }

  applyDimensions() {
    this.view = [this.width, this.height];
  }

  setColourScheme() {
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

  setLegendPosition() {
    if (this.displayLegend === 'below') {
      this.legendPosition = LegendPosition.Below;
    } else {
      this.legendPosition = LegendPosition.Right;
    }
  }

  setCurve() {
    this.curve = curves[this.curveType];
  }

  getData(): void {
    // this.chartsService.getBar2().subscribe((data: any) => {
    //   this.barChart =  data;
    // });
    //   this.chartsService.getLine().subscribe((data: any) => {
    //     this.lineChart =  data;
    //   });

    // this.apiService.getOverallMetrics().subscribe((data: any) => {
    //   this.single = data.map((document: any) => ({
    //     name: dayjs(document.date).format('MMM D'),
    //     value: document.visits,
    //   }));
    // });

    this.barChart = [
      {
        name: 'Sunday',
        series: [
          { name: 'Aug 8-Aug 14', value: 453777 },
          { name: 'Aug 15-Aug 21', value: 436140 },
        ],
      },
      {
        name: 'Monday',
        series: [
          { name: 'Aug 8-Aug 14', value: 1141379 },
          { name: 'Aug 15-Aug 21', value: 1181317 },
        ],
      },
      {
        name: 'Tuesday',
        series: [
          { name: 'Aug 8-Aug 14', value: 911667 },
          { name: 'Aug 15-Aug 21', value: 967833 },
        ],
      },
      {
        name: 'Wednesday',
        series: [
          { name: 'Aug 8-Aug 14', value: 856571 },
          { name: 'Aug 15-Aug 21', value: 920866 },
        ],
      },
      {
        name: 'Thursday',
        series: [
          { name: 'Aug 8-Aug 14', value: 842921 },
          { name: 'Aug 15-Aug 21', value: 901947 },
        ],
      },
      {
        name: 'Friday',
        series: [
          { name: 'Aug 8-Aug 14', value: 800866 },
          { name: 'Aug 15-Aug 21', value: 774515 },
        ],
      },
      {
        name: 'Saturday',
        series: [
          { name: 'Aug 8-Aug 14', value: 413806 },
          { name: 'Aug 15-Aug 21', value: 433290 },
        ],
      },
    ];
    this.lineChart = [
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
  }

  /*
  **
  [yLeftAxisScaleFactor]="yLeftAxisScale" and [yRightAxisScaleFactor]="yRightAxisScale"
  exposes the left and right min and max axis values for custom scaling, it is probably best to
  scale one axis in relation to the other axis but for flexibility to scale either the left or
  right axis both were exposed.
  **
  */

  yLeftAxisScale(min: any, max: any) {
    return { min: `${min}`, max: `${max}` };
  }

  yRightAxisScale(min: any, max: any) {
    return { min: `${min}`, max: `${max}` };
  }

  yLeftTickFormat(data: any) {
    return (data / 1000).toLocaleString();
  }

  yRightTickFormat(data: any) {
    return (data / 1000).toLocaleString();
  }
  /*
  **
  End of Combo Chart
  **
  */

  onSelect(event: any) {
    console.log(event);
  }
}

const curves = {
  Basis: shape.curveBasis,
  Bundle: shape.curveBundle.beta(1),
  Cardinal: shape.curveCardinal,
  'Catmull Rom': shape.curveCatmullRom,
  Linear: shape.curveLinear,
  'Monotone X': shape.curveMonotoneX,
  'Monotone Y': shape.curveMonotoneY,
  Natural: shape.curveNatural,
  Step: shape.curveStep,
  'Step After': shape.curveStepAfter,
  'Step Before': shape.curveStepBefore,
  default: shape.curveLinear,
};

export type Curves = keyof typeof curves;
