import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxChartsModule } from '@lega0208/ngx-charts';

// todo: same as router file-- will probably want to split each view into its own module (and probably load lazily)
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { OverviewComponent } from './views/overview/overview.component';
import { OverviewSummaryComponent } from './views/overview/overview-summary/overview-summary.component';
import { PagesComponent } from './views/pages/pages.component';
import { PagesHomeComponent } from './views/pages/pages-home/pages-home.component';
import { TasksComponent } from './views/tasks/tasks.component';
import { ProjectsComponent } from './views/projects/projects.component';
import { PageDetailsComponent } from './views/pages/page-details/page-details.component';
import { PageDetailsSummaryComponent } from './views/pages/page-details/page-details-summary/page-details-summary.component';
import { PageDetailsWebtrafficComponent } from './views/pages/page-details/page-details-webtraffic/page-details-webtraffic.component';
import { PageDetailsSearchAnalyticsComponent } from './views/pages/page-details/page-details-search-analytics/page-details-search-analytics.component';
import { PageDetailsFeedbackComponent } from './views/pages/page-details/page-details-feedback/page-details-feedback.component';
import { OverviewWebtrafficComponent } from './views/overview/overview-webtraffic/overview-webtraffic.component';
import { OverviewSearchAnalyticsComponent } from './views/overview/overview-search-analytics/overview-search-analytics.component';
import { OverviewFeedbackComponent } from './views/overview/overview-feedback/overview-feedback.component';
import { OverviewCalldriversComponent } from './views/overview/overview-calldrivers/overview-calldrivers.component';
import { OverviewUxTestsComponent } from './views/overview/overview-ux-tests/overview-ux-tests.component';
import { TasksHomeComponent } from './views/tasks/tasks-home/tasks-home.component';
import { TaskDetailsComponent } from './views/tasks/task-details/task-details.component';
import { TaskDetailsSummaryComponent } from './views/tasks/task-details/task-details-summary/task-details-summary.component';
import { TaskDetailsWebtrafficComponent } from './views/tasks/task-details/task-details-webtraffic/task-details-webtraffic.component';
import { TaskDetailsSearchAnalyticsComponent } from './views/tasks/task-details/task-details-search-analytics/task-details-search-analytics.component';
import { TaskDetailsFeedbackComponent } from './views/tasks/task-details/task-details-feedback/task-details-feedback.component';
import { ProjectsHomeComponent } from './views/projects/projects-home/projects-home.component';
import { ProjectDetailsComponent } from './views/projects/project-details/project-details.component';
import { ProjectDetailsSummaryComponent } from './views/projects/project-details/project-details-summary/project-details-summary.component';
import { ProjectDetailsWebtrafficComponent } from './views/projects/project-details/project-details-webtraffic/project-details-webtraffic.component';
import { ProjectDetailsSearchAnalyticsComponent } from './views/projects/project-details/project-details-search-analytics/project-details-search-analytics.component';
import { ProjectDetailsFeedbackComponent } from './views/projects/project-details/project-details-feedback/project-details-feedback.component';
import { CardComponent } from './components/card/card.component';
import { DateSelectorComponent } from './components/date-selector/date-selector.component';
import { ExampleChartComponent } from './components/example-chart/example-chart.component';
import { DataTableComponent } from './components/datatable/data-table/data-table.component';
import { GroupedVerticalBarChartComponent } from './components/charts/grouped-vertical-bar-chart/grouped-vertical-bar-chart.component';
import { VerticalBarChartComponent } from './components/charts/vertical-bar-chart/vertical-bar-chart.component';
//import { AccordianComponent } from './components/datatable/accordian/accordian.component';
import {
  ComboGroupedVerticalBarLineChartComponent,
  ComboSeriesVerticalComponent,
} from './components/charts/combo/combo-grouped-vertical-bar-line-chart';
import { GroupedVerticalBarLineChartComponent } from './components/charts/grouped-vertical-bar-line-chart/grouped-vertical-bar-line-chart.component';
import { PieChartComponent } from './components/charts/pie-chart/pie-chart.component';
import { LineChartComponent } from './components/charts/line-chart/line-chart.component';
import { StackedVerticalBarChartComponent } from './components/charts/stacked-vertical-bar-chart/stacked-vertical-bar-chart.component';
import { HorizontalBarChartComponent } from './components/charts/horizontal-bar-chart/horizontal-bar-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    OverviewComponent,
    OverviewSummaryComponent,
    PagesComponent,
    PagesHomeComponent,
    TasksComponent,
    ProjectsComponent,
    PageDetailsComponent,
    PageDetailsSummaryComponent,
    PageDetailsWebtrafficComponent,
    PageDetailsSearchAnalyticsComponent,
    PageDetailsFeedbackComponent,
    OverviewWebtrafficComponent,
    OverviewSearchAnalyticsComponent,
    OverviewFeedbackComponent,
    OverviewCalldriversComponent,
    OverviewUxTestsComponent,
    TasksHomeComponent,
    TaskDetailsComponent,
    TaskDetailsSummaryComponent,
    TaskDetailsWebtrafficComponent,
    TaskDetailsSearchAnalyticsComponent,
    TaskDetailsFeedbackComponent,
    ProjectsHomeComponent,
    ProjectDetailsComponent,
    ProjectDetailsSummaryComponent,
    ProjectDetailsWebtrafficComponent,
    ProjectDetailsSearchAnalyticsComponent,
    ProjectDetailsFeedbackComponent,
    DateSelectorComponent,
    ExampleChartComponent,
    DataTableComponent,
    CardComponent,
    GroupedVerticalBarChartComponent,
    VerticalBarChartComponent,

    ComboGroupedVerticalBarLineChartComponent,
    ComboSeriesVerticalComponent,
    GroupedVerticalBarLineChartComponent,
    PieChartComponent,
    LineChartComponent,
    StackedVerticalBarChartComponent,
    HorizontalBarChartComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgbPopoverModule,
    NgbAccordionModule,
    NgxChartsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
