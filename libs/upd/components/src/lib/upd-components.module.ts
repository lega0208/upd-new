import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  NgbDropdownModule,
  NgbPopoverModule,
  NgbAlertModule,
  NgbAccordionModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NgxChartsModule } from '@amonsour/ngx-charts';
import { CardComponent } from './card/card.component';
import { DataCardComponent } from './data-card/data-card.component';
import { DataTableComponent } from './data-table/data-table.component';
import { DateSelectorComponent } from './date-selector/date-selector.component';
import { DateSelectorDropdownComponent } from './date-selector/date-selector-dropdown.component';
import { NavTabsComponent } from './nav-tabs/nav-tabs.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
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
  PieChartComponent,
} from './charts';
import { AlertComponent } from './alert/alert.component';
import { AccordionComponent } from './accordion/accordion.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NgbAccordionModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbPopoverModule,
    NgxChartsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
  ],
  declarations: [
    CardComponent,
    DataTableComponent,
    DateSelectorComponent,
    DateSelectorDropdownComponent,
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
    NavTabsComponent,
    DataCardComponent,
    AlertComponent,
    AccordionComponent,
  ],
  exports: [
    NgxChartsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CardComponent,
    DataTableComponent,
    DateSelectorComponent,
    DateSelectorDropdownComponent,
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
    NavTabsComponent,
    DataCardComponent,
    AlertComponent,
    AccordionComponent,
  ],
})
export class UpdComponentsModule {}
