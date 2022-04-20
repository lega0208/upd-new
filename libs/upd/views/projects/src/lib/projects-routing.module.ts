import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProjectsComponent } from './projects.component';
import { ProjectsHomeComponent } from './projects-home/projects-home.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { ProjectDetailsSummaryComponent } from './project-details/project-details-summary/project-details-summary.component';
import { ProjectDetailsWebtrafficComponent } from './project-details/project-details-webtraffic/project-details-webtraffic.component';
import { ProjectDetailsSearchAnalyticsComponent } from './project-details/project-details-search-analytics/project-details-search-analytics.component';
import { ProjectDetailsFeedbackComponent } from './project-details/project-details-feedback/project-details-feedback.component';
import { ProjectDetailsCalldriversComponent } from './project-details/project-details-calldrivers/project-details-calldrivers.component';
import { ProjectDetailsUxTestsComponent } from './project-details/project-details-ux-tests/project-details-ux-tests.component';
import { ProjectDetailsDetailsComponent } from './project-details/project-details-details/project-details-details.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectsComponent,
    children: [
      { path: '', component: ProjectsHomeComponent, pathMatch: 'full' },
      {
        path: ':id',
        component: ProjectDetailsComponent,
        children: [
          { path: '', redirectTo: 'summary', pathMatch: 'full' },
          { path: 'summary', component: ProjectDetailsSummaryComponent },
          { path: 'webtraffic', component: ProjectDetailsWebtrafficComponent },
          {
            path: 'searchanalytics',
            component: ProjectDetailsSearchAnalyticsComponent,
          },
          { path: 'pagefeedback', component: ProjectDetailsFeedbackComponent },
          {
            path: 'calldrivers',
            component: ProjectDetailsCalldriversComponent,
          },
          { path: 'uxtests', component: ProjectDetailsUxTestsComponent },
          // { path: 'details', component: ProjectDetailsDetailsComponent },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectsRoutingModule {}
