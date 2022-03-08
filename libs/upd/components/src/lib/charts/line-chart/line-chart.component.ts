import { Component, Input, OnInit } from '@angular/core';
import { Color, ScaleType, LegendPosition } from '@amonsour/ngx-charts';
import dayjs from 'dayjs';
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
  @Input() data = 'overall';
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

  //curveType = 'default';

  colorScheme!: Color;
  legendPosition!: LegendPosition;
  curve: any;

  // data
  single: any = [];

  ngOnInit(): void {
    this.getData();
    this.setLegendPosition();
    this.setColourScheme();

    this.setCurve();
  }

  getData(): void {
    this.single = [
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
    // this.apiService.getOverallMetrics().subscribe((data: any) => {
    //   this.single = data.map((document: any) => ({
    //     name: dayjs(document.date).format('MMM D'),
    //     value: document.visits,
    //   }));
    // });
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
    this.curve = curves[this.curveType];
  }

  yAxisScale(min: any, max: any) {
    return { min: `${min}`, max: `${max}` };
  }

  yAxisTickFormat(data: any) {
    return (data / 1000).toLocaleString();
  }

  onSelect(event: any) {
    console.log(event);
  }
}


