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
import { ColumnConfig } from '../data-table-styles/types';
import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { Observable, of } from 'rxjs';
import { I18nFacade } from '@cra-arc/upd/state';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css'],
})
export class ChartsComponent implements OnInit {
  view?: [number, number];
  @Input() lang!: LocaleId;
  @Input() convertToLine = false;

  dayjs = dayjs;

  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() currentLang$: Observable<LocaleId> = of(EN_CA);
  @Input() animations = true;
  @Input() type: ChartTypes = 'pie';
  @Input() width = 1020;
  @Input() height = 400;
  @Input() fitContainer = true;
  @Input() gradient = false;
  @Input() displayLegend = 'below';
  @Input() colour: string[] = [
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
  ];
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
  @Input() barPadding = 2;
  @Input() groupPadding = 2;
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
  @Input() showRightYAxisLabel = false;
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
  @Input() barChart: any = [];
  @Input() lineChart: any = [];
  @Input() chartMerge: any = [];
  colorLabelDefault = 'black';
  lineChartScheme!: Color;
  comboBarScheme!: Color;
  colourMerge!: Color;
  curve?: CurveFactory;

  colorScheme!: Color;
  legendPosition!: LegendPosition;

  // pie/donut
  doughnut = false;

  // bubble chart
  maxRadius = 20;
  minRadius = 5;

  @Input() isPercent = false;

  chartData: SingleSeries | MultiSeries | null = [];
  @Input() table: any;
  @Input() tableCols: ColumnConfig[] = [];

  ngOnInit() {
    this.setLegendPosition();
    if (this.type === 'combo-bar-line') this.setComboColourScheme();
    else this.setColourScheme();
    this.setDoughnut();
    this.setCurve();

    if (!this.fitContainer) {
      this.applyDimensions();
    }

    this.currentLang$.subscribe((nextLang) => {
      this.lang = nextLang;
    });

    if (this.isPercent && this.type === 'horizontal-bar') {
      this.xScaleMax = 1;
      this.xScaleMin = 0;
    } else if (this.isPercent && this.type === 'bubble') {
      this.yScaleMax = 1;
      this.yScaleMin = 0;
    }
  }

  applyDimensions() {
    this.view = [this.width, this.height];
  }

  get hasData() {
    return !(
      this.data.length === 0 &&
      (this.barChart?.length === 0 && this.lineChart?.length === 0)
    );
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

    this.colourMerge = {
      name: 'cool',
      selectable: true,
      group: ScaleType.Ordinal,
      domain: ['#2E5EA7', '#B5C2CC', '#f37d35', '#fbbc4d'],
    };
  }

  pieTooltipText({ data }: any) {
    const label = formatLabel(data.name);
    const val = formatLabel(data.value);

    return `
      <span class='tooltip-label'>${escapeLabel(label)}</span>
      <span class='tooltip-val'>${val}</span>
    `;
  }

  yLeftAxisScale(min: number, max: number) {
    return { min: `${min}`, max: `${max}` };
  }

  yRightAxisScale(min: number, max: number) {
    return { min: `${min}`, max: `${max}` };
  }

  yLeftTickFormat(data: number) {
    return (data / 1000).toLocaleString(this.lang);
  }

  yRightTickFormat(data: number) {
    return (data / 1000).toLocaleString(this.lang);
  }

  xAxisTickFormat(data: number) {
    return (data / 1000).toLocaleString(this.lang);
  }

  xAxisPercentTickFormat(data: number) {
    return `${data * 100}%`;
  }

  yAxisTickFormat(data: number) {
    return (data / 1000).toLocaleString(this.lang);
  }

  yAxisPercentTickFormat(data: number) {
    return `${data * 100}%`;
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

  constructor(private i18n: I18nFacade) {}
}