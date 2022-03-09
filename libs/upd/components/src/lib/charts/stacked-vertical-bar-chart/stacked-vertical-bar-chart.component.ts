import { Component, Input, OnInit } from '@angular/core';
import { Color, ScaleType, LegendPosition, MultiSeries } from '@amonsour/ngx-charts';
import dayjs from 'dayjs';

@Component({
  selector: 'app-stacked-vertical-bar-chart',
  templateUrl: './stacked-vertical-bar-chart.component.html',
  styleUrls: ['./stacked-vertical-bar-chart.component.scss'],
})
export class StackedVerticalBarChartComponent implements OnInit {
  // data
  multi: MultiSeries = [];
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
  @Input() rotateXAxisTicks = true;
  @Input() barPadding = 6;
  @Input() gradient = false;
  @Input() displayLegend = 'below';
  @Input() xAxisLabel = 'Date';
  @Input() yAxisLabel = 'Visits (in thousands)';
  @Input() colour = ['#2E5EA7', '#B5C2CC'];
  @Input() showLegend = true;
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

  @Input() data = 'overall';

  week: string[] = dayjs.weekdays();

  colorScheme!: Color;
  legendPosition!: LegendPosition;

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

    this.multi = [
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

  // processData(results: any) {
  //   let entry: any = [];
  //   let dateArray: any = [];

  //   for (const arr in results) {
  //     dateArray.push(new Date(results[arr].date));
  //   }

  //   const maxDate = new Date(Math.max(...dateArray));
  //   const minDate = new Date(Math.min(...dateArray));
  //   const midDate = new Date((minDate.getTime() + maxDate.getTime()) / 2);

  //   dateArray = [];
  //   dateArray.push(minDate, maxDate, midDate);

  //   for (const weekday in this.week) {
  //     entry = [];
  //     for (const arr in results) {
  //       const day = dayjs(results[arr].date).format('dddd');
  //       if (this.week[weekday] === day) {
  //         let name: string;
  //         entry.length == 0
  //           ? (name =
  //               dayjs(dateArray[0]).format('MMM D') +
  //               '-' +
  //               dayjs(dateArray[2]).format('MMM D'))
  //           : (name =
  //               dayjs(dateArray[2]).add(1, 'day').format('MMM D') +
  //               '-' +
  //               dayjs(dateArray[1]).format('MMM D'));
  //         entry.push({
  //           name: name,
  //           value: results[arr].value,
  //         });
  //       }
  //     }
  //     this.multi.push({ name: this.week[weekday], series: entry });
  //   }
  //   console.log(JSON.stringify(this.multi));
  //   return this.multi;
  // }

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
