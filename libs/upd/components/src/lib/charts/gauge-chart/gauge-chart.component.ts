import { Component, Input, OnInit } from '@angular/core';
import {
  Color,
  ScaleType,
  LegendPosition,
  SingleSeries,
} from '@amonsour/ngx-charts';
import dayjs from 'dayjs';

@Component({
  selector: 'app-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrls: ['./gauge-chart.component.scss']
})
export class GaugeChartComponent implements OnInit {

  view?: [number, number];
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() animations = true;
  @Input() width = 1020;
  @Input() height = 400;
  @Input() fitContainer = false;
  @Input() gradient = false;
  @Input() displayLegend = 'below';
  @Input() colour: string[] = ['#0D47A1', '#F57F17'];
  @Input() showLegend = true;
  @Input() data = 'overall';
  @Input() legendTitle = 'Legend';
  @Input() tooltipDisabled = false;
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

  colorScheme!: Color;
  legendPosition!: LegendPosition;

  // data
  single: SingleSeries = [];

  ngOnInit(): void {
    this.getData();
    this.setLegendPosition();
    this.setColourScheme();

    if (!this.fitContainer) {
      this.applyDimensions();
    }
  }

  getData(): void {
    // this.apiService.getOverallMetrics().subscribe((data: any) => {
    //   this.single = data.map((document: any) => ({
    //     name: dayjs(document.date).format('MMM D'),
    //     value: document.visits,
    //   }));
    // });

    this.single = [
      {
        "name": "KPI",
        "value": this.getRandom(1, 100),
      },
    ];
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

  getRandom(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  getGaugeMin() {
    return this.gaugeMin;
  }

  getGaugeMax() {
    return this.gaugeMax;
  }

  axisTickFormat(data: number) {
    return (data + '%');
  }

  valueFormat(data: number) {
    return (data + '%'); // + this.gaugeMax// + '-' + this.getGaugeMax();
  }

  onSelect(event: any) {
    console.log(event);
  }
}
