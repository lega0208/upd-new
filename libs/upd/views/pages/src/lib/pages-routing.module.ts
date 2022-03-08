import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PagesComponent } from './pages.component';
import { PagesHomeComponent } from './pages-home/pages-home.component';
import { PageDetailsComponent } from './page-details/page-details.component';
import { PageDetailsSummaryComponent } from './page-details/page-details-summary/page-details-summary.component';
import { PageDetailsWebtrafficComponent } from './page-details/page-details-webtraffic/page-details-webtraffic.component';
import { PageDetailsSearchAnalyticsComponent } from './page-details/page-details-search-analytics/page-details-search-analytics.component';
import { PageDetailsFeedbackComponent } from './page-details/page-details-feedback/page-details-feedback.component';

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      { path: '', component: PagesHomeComponent, pathMatch: 'full' },
      {
        path: 'details',
        component: PageDetailsComponent,
        children: [
          { path: '', redirectTo: 'summary', pathMatch: 'full' },
          { path: 'summary', component: PageDetailsSummaryComponent },
          { path: 'webtraffic', component: PageDetailsWebtrafficComponent },
          {
            path: 'search_analytics',
            component: PageDetailsSearchAnalyticsComponent,
          },
          { path: 'feedback', component: PageDetailsFeedbackComponent },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
