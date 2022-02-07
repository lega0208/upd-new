import { Component, OnInit } from '@angular/core';
import { first, map } from 'rxjs/operators';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { ApiService } from '../../services/api/api.service';
import dayjs from 'dayjs';

@Component({
  selector: 'app-example-chart',
  templateUrl: './example-chart.component.html',
  styleUrls: ['./example-chart.component.css'],
})
export class ExampleChartComponent implements OnInit {
  // data
  single = [];

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = true;
  xAxisLabel = 'Date';
  showYAxisLabel = true;
  yAxisLabel = 'Visits';
  roundEdges = false;

  colorScheme: Color = {
    group: ScaleType.Ordinal,
    name: 'daScheme',
    selectable: true,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'], // todo: set to right colours
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.getData();

    // fetch('/api/overall-metrics' + window.location.search)
    //   .then((res) => res.json())
    //   .then((data) => {
    //     this.single = data.map((document: any) => ({ name: document.Date, value: document.Visits }));
    //   });
  }

  getData() {
    this.apiService.getOverallMetrics().subscribe((data: any) => {
      this.single = data.map((document: any) => ({
        name: dayjs(document.date).format('MMM D'),
        value: document.visits,
      }));
    });
  }

  onSelect(event: any) {
    console.log(event);
  }
}
