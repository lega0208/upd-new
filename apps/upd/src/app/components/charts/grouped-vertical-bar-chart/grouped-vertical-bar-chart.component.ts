import { Component, Input, OnInit } from '@angular/core';
import { Color, ScaleType, LegendPosition } from '@lega0208/ngx-charts';
//import { ChartsService } from '../../charts.service';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import { ApiService } from '../../../services/api/api.service';
dayjs.extend(localeData);

@Component({
  selector: 'app-grouped-vertical-bar-chart',
  templateUrl: './grouped-vertical-bar-chart.component.html',
  styleUrls: ['./grouped-vertical-bar-chart.component.scss'],
})
export class GroupedVerticalBarChartComponent implements OnInit {
  // data
  single: any = [];
  multi: any = [];
  view: any;

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
  @Input() yAxisLabel = 'Number of Visits';
  @Input() colour = ['#2E5EA7', '#B5C2CC'];
  @Input() showLegend = false;
  @Input() showGridLines = false;
  @Input() noBarWhenZero = true;
  @Input() legendTitle = 'Legend';
  @Input() trimXAxisTicks = true;
  @Input() trimYAxisTicks = true;
  @Input() maxXAxisTickLength = 16;
  @Input() maxYAxisTickLength = 16;

  @Input() data = 'overall';

  week: string[] = dayjs.weekdays();

  colorScheme: any;
  legendPosition: any;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.getData();
    this.setColourScheme();
    this.setLegendPosition();

    if (!this.fitContainer) {
      this.applyDimensions();
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

  setLegendPosition() {
    if (this.displayLegend === 'below') {
      this.legendPosition = LegendPosition.Below;
    } else {
      this.legendPosition = LegendPosition.Right;
    }
  }

  getData() {
    // this.apiService.getOverallMetrics().subscribe((data: any) => {
    //   this.single = data.map((document: any) => ({
    //     name: dayjs(document.date).format('MMM D'),
    //     value: document.visits,
    //   }));
    // });

    this.single = [
      {
        name: 'Sunday',
        series: [
          { name: 'Aug 8-Aug 14', value: 453777 },
          { name: 'Aug 15-Aug 21', value: 436140 },
        ],
      },
      {
        name: 'Monday',
        series: [
          { name: 'Aug 8-Aug 14', value: 1141379 },
          { name: 'Aug 15-Aug 21', value: 1181317 },
        ],
      },
      {
        name: 'Tuesday',
        series: [
          { name: 'Aug 8-Aug 14', value: 911667 },
          { name: 'Aug 15-Aug 21', value: 967833 },
        ],
      },
      {
        name: 'Wednesday',
        series: [
          { name: 'Aug 8-Aug 14', value: 856571 },
          { name: 'Aug 15-Aug 21', value: 920866 },
        ],
      },
      {
        name: 'Thursday',
        series: [
          { name: 'Aug 8-Aug 14', value: 842921 },
          { name: 'Aug 15-Aug 21', value: 901947 },
        ],
      },
      {
        name: 'Friday',
        series: [
          { name: 'Aug 8-Aug 14', value: 800866 },
          { name: 'Aug 15-Aug 21', value: 774515 },
        ],
      },
      {
        name: 'Saturday',
        series: [
          { name: 'Aug 8-Aug 14', value: 413806 },
          { name: 'Aug 15-Aug 21', value: 433290 },
        ],
      },
    ];
  }

  processData(results: any) {
    let entry: any = [];
    let dateArray: any = [];

    for (const arr in results) {
      dateArray.push(new Date(results[arr].date));
    }

    const maxDate = new Date(Math.max(...dateArray));
    const minDate = new Date(Math.min(...dateArray));
    const midDate = new Date((minDate.getTime() + maxDate.getTime()) / 2);

    dateArray = [];
    dateArray.push(minDate, maxDate, midDate);

    for (const weekday in this.week) {
      entry = [];
      for (const arr in results) {
        const day = dayjs(results[arr].date).format('dddd');
        if (this.week[weekday] === day) {
          let name: string;
          entry.length == 0
            ? (name =
                dayjs(dateArray[0]).format('MMM D') +
                '-' +
                dayjs(dateArray[2]).format('MMM D'))
            : (name =
                dayjs(dateArray[2]).add(1, 'day').format('MMM D') +
                '-' +
                dayjs(dateArray[1]).format('MMM D'));
          entry.push({
            name: name,
            value: results[arr].value,
          });
        }
      }
      this.multi.push({ name: this.week[weekday], series: entry });
    }
    console.log(JSON.stringify(this.multi));
    return this.multi;
  }

  applyDimensions() {
    this.view = [this.width, this.height];
  }

  onSelect(event: any) {
    console.log(event);
  }
}
