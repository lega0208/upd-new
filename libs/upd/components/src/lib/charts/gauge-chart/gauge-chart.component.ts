import { Component, Input, OnInit } from '@angular/core';
import {
  formatLabel,
  escapeLabel,
  Color,
  ScaleType,
  LegendPosition,
} from '@amonsour/ngx-charts';
import dayjs from 'dayjs';

@Component({
  selector: 'app-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrls: ['./gauge-chart.component.scss']
})
export class GaugeChartComponent implements OnInit {

  view: any;
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

    gaugeMin = 0;
    gaugeMax = 100;
    gaugeLargeSegments = 2;
    gaugeSmallSegments = 0;
    gaugeTextValue = '';
    gaugeUnits = '';
    gaugeAngleSpan = 180;
    gaugeStartAngle = -90;
    gaugeShowAxis = true;
    gaugeValue = 50; // linear gauge value
    gaugePreviousValue = 70;
  showText = true;

      // margin
  margin = true;
  marginTop = 40;
  marginRight = 40;
  marginBottom = 40;
  marginLeft = 40;

  colorScheme!: Color;
  legendPosition!: LegendPosition;

  // data
  single: any = [];

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

  axisTickFormat(data: any) {
    return (data + '%');
  }

  valueFormat(data: any) {
    return (data + '%'); // + this.gaugeMax// + '-' + this.getGaugeMax();
  }

  onSelect(event: any) {
    console.log(event);
  }
}
