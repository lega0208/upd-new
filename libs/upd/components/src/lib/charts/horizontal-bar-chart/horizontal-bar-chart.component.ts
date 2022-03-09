import { Component, Input, OnInit } from '@angular/core';
import { Color, ScaleType, LegendPosition, SingleSeries } from '@amonsour/ngx-charts';
import dayjs from 'dayjs';

@Component({
  selector: 'app-horizontal-bar-chart',
  templateUrl: './horizontal-bar-chart.component.html',
  styleUrls: ['./horizontal-bar-chart.component.scss'],
})
export class HorizontalBarChartComponent implements OnInit {
  view?: [number, number];
  @Input() single: SingleSeries | null = [];
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() width = 1020;
  @Input() height = 400;
  @Input() fitContainer = true;
  @Input() showXAxis = true;
  @Input() showYAxis = true;
  @Input() showXAxisLabel = true;
  @Input() showYAxisLabel = true;
  @Input() roundEdges = false;
  @Input() rotateXAxisTicks = true;
  @Input() barPadding = 8;
  @Input() gradient = false;
  @Input() displayLegend = 'below';
  @Input() xAxisLabel = 'Visits (in thousands)';
  @Input() yAxisLabel = 'Date';
  @Input() colour: string[] = ['#2E5EA7', '#64B5F6', '#26A69A', '#FBC02D'];
  @Input() showLegend = false;
  @Input() showGridLines = false;
  @Input() noBarWhenZero = true;
  @Input() data = 'overall';
  @Input() legendTitle = 'Legend';
  @Input() trimXAxisTicks = true;
  @Input() trimYAxisTicks = true;
  @Input() maxXAxisTickLength = 16;
  @Input() maxYAxisTickLength = 16;
  @Input() showDataLabel = false;
  @Input() xScaleMax!: number;
  @Input() xScaleMin = 0;
  @Input() roundDomains = false;
  @Input() tooltipDisabled = false;
  @Input() animations = true;

  colorScheme!: Color;
  legendPosition!: LegendPosition;

  ngOnInit(): void {
    this.setLegendPosition();
    this.setColourScheme();

    if (!this.fitContainer) {
      this.applyDimensions();
    }
  }

  applyDimensions() {
    this.view = [this.width, this.height];
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

  xAxisTickFormat(data: number) {
    return (data / 1000).toLocaleString();
  }

  onSelect(event: any) {
    console.log(event);
  }
}
