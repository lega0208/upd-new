import { Component, Input, OnInit } from '@angular/core';
import {
  Color,
  ScaleType,
  LegendPosition,
  MultiSeries,
} from '@amonsour/ngx-charts';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
dayjs.extend(localeData);

@Component({
  selector: 'app-grouped-vertical-bar-chart',
  templateUrl: './grouped-vertical-bar-chart.component.html',
  styleUrls: ['./grouped-vertical-bar-chart.component.scss'],
})
export class GroupedVerticalBarChartComponent implements OnInit {
  // data
  @Input() barChart: MultiSeries | null = [];

  view?: [number, number];
  // options
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() fitContainer = true;
  @Input() width = 1020;
  @Input() height = 300;
  @Input() showXAxis = true;
  @Input() showYAxis = true;
  @Input() showXAxisLabel = true;
  @Input() showYAxisLabel = true;
  @Input() roundEdges = false;
  @Input() rotateXAxisTicks = true;
  @Input() barPadding = 6;
  @Input() groupPadding = 12;
  @Input() gradient = false;
  @Input() displayLegend = 'below';
  @Input() xAxisLabel = 'Date';
  @Input() yAxisLabel = 'Visits (in thousands)';
  @Input() colour = ['#2E5EA7', '#64B5F6', '#26A69A', '#FBC02D', '#3EE9B7'];
  @Input() showLegend = false;
  @Input() showGridLines = false;
  @Input() noBarWhenZero = true;
  @Input() legendTitle = 'Legend';
  @Input() trimXAxisTicks = true;
  @Input() trimYAxisTicks = true;
  @Input() maxXAxisTickLength = 16;
  @Input() maxYAxisTickLength = 16;
  @Input() showDataLabel = false;
  @Input() yScaleMax!: number;
  @Input() yScaleMin = 0;
  @Input() roundDomains = true;
  @Input() tooltipDisabled = false;
  @Input() animations = true;

  week: string[] = dayjs.weekdays();

  colorScheme!: Color;
  legendPosition!: LegendPosition;

  ngOnInit(): void {
    this.setColourScheme();
    this.setLegendPosition();
  }

  setColourScheme() {
    this.colorScheme = {
      group: ScaleType.Ordinal,
      name: 'daScheme',
      selectable: true,
      domain: this.colour,
    };
  }

  setLegendPosition() {
    if (this.displayLegend === 'below') {
      this.legendPosition = LegendPosition.Below;
    } else {
      this.legendPosition = LegendPosition.Right;
    }
  }

  applyDimensions() {
    this.view = [this.width, this.height];
  }

  yAxisTickFormat(data: number) {
    return (data / 1000).toLocaleString();
  }

  onSelect(event: any) {
    console.log(event);
  }
}
