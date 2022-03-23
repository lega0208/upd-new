import { Component, Input, OnInit } from '@angular/core';
import { Color, ScaleType, LegendPosition, MultiSeries } from '@amonsour/ngx-charts';
import { CurveFactory } from 'd3-shape';
import { curves, Curves } from '../types';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
})
export class LineChartComponent implements OnInit {
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() animations = true;
  @Input() showXAxis = true;
  @Input() showYAxis = true;
  @Input() showXAxisLabel = true;
  @Input() showYAxisLabel = true;
  @Input() roundEdges = false;
  @Input() rotateXAxisTicks = true;
  @Input() barPadding = 8;
  @Input() gradient = false;
  @Input() showLegend = false;
  @Input() displayLegend = 'below';
  @Input() legendTitle = 'Legend';
  @Input() xAxisLabel = 'Date';
  @Input() yAxisLabel = 'Visits (in thousands)';
  @Input() colour: string[] = ['#2E5EA7', '#64B5F6', '#26A69A', '#FBC02D'];
  @Input() showGridLines = true;
  @Input() noBarWhenZero = true;
  @Input() data: MultiSeries = []
  @Input() trimXAxisTicks = true;
  @Input() trimYAxisTicks = true;
  @Input() maxXAxisTickLength = 16;
  @Input() maxYAxisTickLength = 16;
  @Input() rangeFillOpacity = 0.15;
  @Input() autoScale = false;
  @Input() yScaleMax!: number;
  @Input() yScaleMin = 0;
  @Input() xScaleMax!: number;
  @Input() xScaleMin = 0;
  @Input() tooltipDisabled = false;
  @Input() timeline = false;
  @Input() curveType: Curves = 'Basis';
  @Input() roundDomains = false;

  colorScheme!: Color;
  legendPosition!: LegendPosition;
  curve?: CurveFactory;

  ngOnInit(): void {
    this.setLegendPosition();
    this.setColourScheme();
    this.setCurve();
  }

  setLegendPosition() {
    if (this.displayLegend === 'below') {
      this.legendPosition = LegendPosition.Below;
    } else {
      this.legendPosition = LegendPosition.Right;
    }
  }

  setColourScheme() {
    this.colorScheme = {
      group: ScaleType.Ordinal,
      name: 'daScheme',
      selectable: true,
      domain: this.colour,
    };
  }

  setCurve() {
    this.curve = curves[this.curveType] as CurveFactory;
  }

  yAxisScale(min: number, max: number) {
    return { min: `${min}`, max: `${max}` };
  }

  yAxisTickFormat(data: number) {
    return (data / 1000).toLocaleString();
  }

  onSelect(event: any) {
    console.log(event);
  }
}


