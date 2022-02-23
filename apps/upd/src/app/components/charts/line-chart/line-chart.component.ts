import { Component, Input, OnInit } from '@angular/core';
import {
  Color,
  ScaleType,
  LegendPosition,
  TreeMapModule,
} from '@lega0208/ngx-charts';
import { ApiService } from '../../../services/api/api.service';
import dayjs from 'dayjs';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
})
export class LineChartComponent implements OnInit {
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() showXAxis = true;
  @Input() showYAxis = true;
  @Input() showXAxisLabel = true;
  @Input() showYAxisLabel = true;
  @Input() roundEdges = false;
  @Input() rotateXAxisTicks = true;
  @Input() barPadding = 8;
  @Input() gradient = false;
  @Input() displayLegend = 'below';
  @Input() xAxisLabel = 'Date';
  @Input() yAxisLabel = 'Number of Visits';
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

  colorScheme: any;
  legendPosition: any;

  // data
  single: any = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.getData();
    this.setLegendPosition();
    this.setColourScheme();
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

  onSelect(event: any) {
    console.log(event);
  }
}
