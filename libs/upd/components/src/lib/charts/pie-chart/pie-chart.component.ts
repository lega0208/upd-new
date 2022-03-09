import { Component, Input, OnInit } from '@angular/core';
import {
  formatLabel,
  escapeLabel,
  Color,
  ScaleType,
  LegendPosition,
  SingleSeries,
} from '@amonsour/ngx-charts';
import dayjs from 'dayjs';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
})
export class PieChartComponent implements OnInit {
  view?: [number, number];
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() animations = true;
  @Input() width = 1020;
  @Input() height = 400;
  @Input() fitContainer = true;
  @Input() gradient = false;
  @Input() displayLegend = 'below';
  @Input() colour: string[] = ['#0D47A1', '#F57F17'];
  @Input() showLegend = true;
  @Input() data = 'overall';
  @Input() legendTitle = 'Legend';
  @Input() tooltipDisabled = false;
  @Input() showLabels = false;
  @Input() explodeSlices = false;
  @Input() arcWidth = 0.25;
  @Input() type = '';

  colorScheme!: Color;
  legendPosition!: LegendPosition;
  doughnut = false;

  // data
  single: SingleSeries = [];

  ngOnInit(): void {
    this.getData();
    this.setLegendPosition();
    this.setColourScheme();
    this.setDoughnut();

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
      { name: 'Yes', value: 238 },
      { name: 'No', value: 106 },
    ];
  }

  applyDimensions() {
    this.view = [this.width, this.height];
  }

  setDoughnut() {
    if (this.type === 'doughnut' || this.type === 'donut') {
      this.doughnut = true;
    } else {
      this.doughnut = false;
    }
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

  pieTooltipText({ data }: any) {
    const label = formatLabel(data.name);
    const val = formatLabel(data.value);

    return `
      <span class="tooltip-label">${escapeLabel(label)}</span>
      <span class="tooltip-val">${val}</span>
    `;
  }

  onSelect(event: any) {
    console.log(event);
  }
}
