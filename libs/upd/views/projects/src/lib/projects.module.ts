import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UpdComponentsModule } from '@cra-arc/upd-components';
import { ProjectsComponent } from './projects.component';
import { ProjectsHomeComponent } from './projects-home/projects-home.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { ProjectDetailsSummaryComponent } from './project-details/project-details-summary/project-details-summary.component';
import { ProjectDetailsWebtrafficComponent } from './project-details/project-details-webtraffic/project-details-webtraffic.component';
import { ProjectDetailsSearchAnalyticsComponent } from './project-details/project-details-search-analytics/project-details-search-analytics.component';
import { ProjectDetailsFeedbackComponent } from './project-details/project-details-feedback/project-details-feedback.component';
import { ProjectsRoutingModule } from './projects-routing.module';

@NgModule({
  imports: [
    CommonModule,
    ProjectsRoutingModule,
    UpdComponentsModule,
  ],
  declarations: [
    ProjectsComponent,
    ProjectsHomeComponent,
    ProjectDetailsComponent,
    ProjectDetailsSummaryComponent,
    ProjectDetailsWebtrafficComponent,
    ProjectDetailsSearchAnalyticsComponent,
    ProjectDetailsFeedbackComponent,
  ]
})
export class ProjectsModule {}
