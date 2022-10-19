import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgbModule,
  NgbDropdownModule,
  NgbPopoverModule,
  NgbAlertModule,
  NgbAccordionModule,
  NgbModalModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { NgxChartsModule } from '@amonsour/ngx-charts';
import { I18nModule } from '@dua-upd/upd/i18n';
import { PipesModule } from '@dua-upd/upd/pipes';
import { CardComponent } from './card/card.component';
import { DataCardComponent } from './data-card/data-card.component';
import { DataTableComponent } from './data-table/data-table.component';
import { DateSelectorComponent } from './date-selector/date-selector.component';
import { DateSelectorDropdownComponent } from './date-selector/date-selector-dropdown.component';
import { NavTabsComponent } from './nav-tabs/nav-tabs.component';
import {
  ComboGroupedVerticalBarLineChartComponent,
  ComboSeriesVerticalComponent,
  ComboBubbleLineChartComponent,
  ChartsComponent,
} from './charts';
import { AlertComponent } from './alert/alert.component';
import { AccordionComponent } from './accordion/accordion.component';
import { ModalComponent } from './modal/modal.component';
import { DataKpiCardComponent } from './data-kpi-card/data-kpi-card.component';
import { DataTableStylesComponent } from './data-table-styles/data-table-styles.component';
import { ProjectStatusLabelComponent } from './project-status-label/project-status-label.component';
import { DataTableCardComponent } from './data-table-card/data-table-card.component';
import { Page404Component } from './page-404/page-404.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { ProjectHeaderComponent } from './project-header/project-header.component';
import { CardSecondaryTitleComponent } from './card-secondary-title/card-secondary-title.component';
import { DataTableExportsComponent } from './data-table-exports/data-table-exports.component';
import { DropdownComponent } from './dropdown/dropdown.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NgbAccordionModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbPopoverModule,
    NgbModalModule,
    NgbTooltipModule,
    NgxChartsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    NgbModule,
    I18nModule,
    DropdownModule,
    FormsModule,
    MultiSelectModule,
    SliderModule,
    CalendarModule,
    InputNumberModule,
    PipesModule,
  ],
  declarations: [
    CardComponent,
    DataTableComponent,
    DateSelectorComponent,
    DateSelectorDropdownComponent,
    ComboGroupedVerticalBarLineChartComponent,
    ComboSeriesVerticalComponent,
    ComboBubbleLineChartComponent,
    NavTabsComponent,
    DataCardComponent,
    AlertComponent,
    AccordionComponent,
    ChartsComponent,
    ModalComponent,
    DataTableStylesComponent,
    ProjectStatusLabelComponent,
    DataKpiCardComponent,
    DataTableCardComponent,
    Page404Component,
    LoadingSpinnerComponent,
    ProjectHeaderComponent,
    CardSecondaryTitleComponent,
    DataTableExportsComponent,
    DropdownComponent,
  ],
  exports: [
    NgbPopoverModule,
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
    ComboBubbleLineChartComponent,
    NavTabsComponent,
    DataCardComponent,
    AlertComponent,
    AccordionComponent,
    ChartsComponent,
    ModalComponent,
    DataTableStylesComponent,
    ProjectStatusLabelComponent,
    DataKpiCardComponent,
    DataTableCardComponent,
    Page404Component,
    LoadingSpinnerComponent,
    ProjectHeaderComponent,
    CardSecondaryTitleComponent,
    DataTableExportsComponent,
  ],
})
export class UpdComponentsModule {}
