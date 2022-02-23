import { Component, Input, OnInit } from '@angular/core';
import { Color, ScaleType, LegendPosition } from '@lega0208/ngx-charts';
import { ApiService } from '../../../services/api/api.service';
import dayjs from 'dayjs';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
})
export class PieChartComponent implements OnInit {
  view: any;
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() width = 1020;
  @Input() height = 400;
  @Input() fitContainer = true;
  @Input() gradient = false;
  @Input() displayLegend = 'below';
  @Input() colour: string[] = ['#0D47A1', '#F57F17'];
  @Input() showLegend = true;
  @Input() data = 'overall';
  @Input() legendTitle = 'Legend';
  @Input() type = '';

  colorScheme: any;
  legendPosition: any;
  doughnut = false;

  // data
  single: any = [];

  constructor(private apiService: ApiService) {}

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

  onSelect(event: any) {
    console.log(event);
  }
}
