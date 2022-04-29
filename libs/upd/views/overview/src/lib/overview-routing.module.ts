import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OverviewComponent } from './overview.component';
import { OverviewSummaryComponent } from './overview-summary/overview-summary.component';
import { OverviewWebtrafficComponent } from './overview-webtraffic/overview-webtraffic.component';
import { OverviewSearchAnalyticsComponent } from './overview-search-analytics/overview-search-analytics.component';
import { OverviewFeedbackComponent } from './overview-feedback/overview-feedback.component';
import { OverviewCalldriversComponent } from './overview-calldrivers/overview-calldrivers.component';
import { OverviewUxTestsComponent } from './overview-ux-tests/overview-ux-tests.component';

const routes: Routes = [
  {
    path: '',
    component: OverviewComponent,
    children: [
      { path: '', redirectTo: 'summary', pathMatch: 'full' },
      { path: 'summary', component: OverviewSummaryComponent },
      { path: 'webtraffic', component: OverviewWebtrafficComponent },
      { path: 'searchanalytics', component: OverviewSearchAnalyticsComponent },
      { path: 'pagefeedback', component: OverviewFeedbackComponent },
      // { path: 'calldrivers', component: OverviewCalldriversComponent },
      { path: 'uxtests', component: OverviewUxTestsComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OverviewRoutingModule {}
