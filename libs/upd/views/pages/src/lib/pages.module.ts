import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpdComponentsModule } from '@cra-arc/upd-components';

import { PagesRoutingModule } from './pages-routing.module';
import { PagesComponent } from './pages.component';
import { PagesHomeComponent } from './pages-home/pages-home.component';
import { PageDetailsComponent } from './page-details/page-details.component';
import { PageDetailsSummaryComponent } from './page-details/page-details-summary/page-details-summary.component';
import { PageDetailsWebtrafficComponent } from './page-details/page-details-webtraffic/page-details-webtraffic.component';
import { PageDetailsSearchAnalyticsComponent } from './page-details/page-details-search-analytics/page-details-search-analytics.component';
import { PageDetailsFeedbackComponent } from './page-details/page-details-feedback/page-details-feedback.component';

@NgModule({
  imports: [
    CommonModule,
    PagesRoutingModule,
    UpdComponentsModule,
  ],
  declarations: [
    PagesComponent,
    PagesHomeComponent,
    PageDetailsComponent,
    PageDetailsSummaryComponent,
    PageDetailsWebtrafficComponent,
    PageDetailsSearchAnalyticsComponent,
    PageDetailsFeedbackComponent,
  ],
})
export class PagesModule {}
