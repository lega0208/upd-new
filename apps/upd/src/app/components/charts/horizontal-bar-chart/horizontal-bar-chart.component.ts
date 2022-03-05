import { Component, Input, OnInit } from '@angular/core';
import { Color, ScaleType, LegendPosition } from '@lega0208/ngx-charts';
import { ApiService } from '../../../services/api/api.service';
import dayjs from 'dayjs';

@Component({
  selector: 'app-horizontal-bar-chart',
  templateUrl: './horizontal-bar-chart.component.html',
  styleUrls: ['./horizontal-bar-chart.component.scss'],
})
export class HorizontalBarChartComponent implements OnInit {
  view: any;
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
  showDataLabel = false;
  xScaleMax!: number;
  xScaleMin = 0;
  roundDomains = false;
  tooltipDisabled = false;
  animations = true;

  colorScheme: any;
  legendPosition: any;

  // data
  single = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.getData();
    this.setLegendPosition();
    this.setColourScheme();

    if (!this.fitContainer) {
      this.applyDimensions();
    }
  }

  getData(): void {
    this.apiService.getOverallMetrics().subscribe((data: any) => {
      this.single = data.map((document: any) => ({
        name: dayjs(document.date).format('MMM D'),
        value: document.visits,
      }));
    });
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

  xAxisTickFormat(data: any) {
    return (data / 1000).toLocaleString();
  }

  onSelect(event: any) {
    console.log(event);
  }
}