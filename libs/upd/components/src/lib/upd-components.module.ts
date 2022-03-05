import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { BarVertical2DComponent, NgxChartsModule } from '@lega0208/ngx-charts';
import { CardComponent } from './card/card.component';
import { DataTableComponent } from './data-table/data-table.component';
import { DateSelectorComponent } from './date-selector/date-selector.component';
import {
  ComboGroupedVerticalBarLineChartComponent,
  ComboSeriesVerticalComponent,
  GaugeChartComponent,
  GroupedVerticalBarLineChartComponent,
  GroupedVerticalBarChartComponent,
  HorizontalBarChartComponent,
  LineChartComponent,
  StackedVerticalBarChartComponent,
  VerticalBarChartComponent,
} from './charts';
import { PieChartComponent } from './charts/pie-chart/pie-chart.component';

@NgModule({
  imports: [CommonModule, NgbPopoverModule, NgxChartsModule],
  declarations: [
    CardComponent,
    DataTableComponent,
    DateSelectorComponent,
    ComboGroupedVerticalBarLineChartComponent,
    ComboSeriesVerticalComponent,
    GaugeChartComponent,
    GroupedVerticalBarLineChartComponent,
    GroupedVerticalBarChartComponent,
    HorizontalBarChartComponent,
    LineChartComponent,
    StackedVerticalBarChartComponent,
    VerticalBarChartComponent,
    PieChartComponent,
  ],
  exports: [
    NgxChartsModule,
    CardComponent,
    DataTableComponent,
    DateSelectorComponent,
    ComboGroupedVerticalBarLineChartComponent,
    ComboSeriesVerticalComponent,
    GaugeChartComponent,
    GroupedVerticalBarLineChartComponent,
    GroupedVerticalBarChartComponent,
    HorizontalBarChartComponent,
    LineChartComponent,
    StackedVerticalBarChartComponent,
    VerticalBarChartComponent,
    PieChartComponent,
  ],
})
export class UpdComponentsModule {}
