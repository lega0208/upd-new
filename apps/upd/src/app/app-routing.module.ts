import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// todo: will probably want to seperate views into their own routers
import { OverviewComponent } from './views/overview/overview.component';
import { OverviewSummaryComponent } from './views/overview/overview-summary/overview-summary.component';
import { OverviewWebtrafficComponent } from './views/overview/overview-webtraffic/overview-webtraffic.component';
import { OverviewFeedbackComponent } from './views/overview/overview-feedback/overview-feedback.component';
import { OverviewSearchAnalyticsComponent } from './views/overview/overview-search-analytics/overview-search-analytics.component';
import { OverviewUxTestsComponent } from './views/overview/overview-ux-tests/overview-ux-tests.component';
import { OverviewCalldriversComponent } from './views/overview/overview-calldrivers/overview-calldrivers.component';

import { PagesComponent } from './views/pages/pages.component';
import { PagesHomeComponent } from './views/pages/pages-home/pages-home.component';
import { PageDetailsComponent } from './views/pages/page-details/page-details.component';
import { PageDetailsSummaryComponent } from './views/pages/page-details/page-details-summary/page-details-summary.component';
import { PageDetailsSearchAnalyticsComponent } from './views/pages/page-details/page-details-search-analytics/page-details-search-analytics.component';
import { PageDetailsWebtrafficComponent } from './views/pages/page-details/page-details-webtraffic/page-details-webtraffic.component';
import { PageDetailsFeedbackComponent } from './views/pages/page-details/page-details-feedback/page-details-feedback.component';

import { TasksComponent } from './views/tasks/tasks.component';
import { TasksHomeComponent } from './views/tasks/tasks-home/tasks-home.component';
import { TaskDetailsWebtrafficComponent } from './views/tasks/task-details/task-details-webtraffic/task-details-webtraffic.component';
import { TaskDetailsSummaryComponent } from './views/tasks/task-details/task-details-summary/task-details-summary.component';
import { TaskDetailsFeedbackComponent } from './views/tasks/task-details/task-details-feedback/task-details-feedback.component';
import { TaskDetailsComponent } from './views/tasks/task-details/task-details.component';
import { TaskDetailsSearchAnalyticsComponent } from './views/tasks/task-details/task-details-search-analytics/task-details-search-analytics.component';

import { ProjectsComponent } from './views/projects/projects.component';
import { ProjectsHomeComponent } from './views/projects/projects-home/projects-home.component';
import { ProjectDetailsSummaryComponent } from './views/projects/project-details/project-details-summary/project-details-summary.component';
import { ProjectDetailsWebtrafficComponent } from './views/projects/project-details/project-details-webtraffic/project-details-webtraffic.component';
import { ProjectDetailsSearchAnalyticsComponent } from './views/projects/project-details/project-details-search-analytics/project-details-search-analytics.component';
import { ProjectDetailsComponent } from './views/projects/project-details/project-details.component';
import { ProjectDetailsFeedbackComponent } from './views/projects/project-details/project-details-feedback/project-details-feedback.component';

const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  {
    path: 'overview',
    component: OverviewComponent,
    children: [
      { path: '', redirectTo: 'summary', pathMatch: 'full' },
      { path: 'summary', component: OverviewSummaryComponent },
      { path: 'webtraffic', component: OverviewWebtrafficComponent },
      { path: 'search_analytics', component: OverviewSearchAnalyticsComponent },
      { path: 'feedback', component: OverviewFeedbackComponent },
      { path: 'calldrivers', component: OverviewCalldriversComponent },
      { path: 'uxtests', component: OverviewUxTestsComponent },
    ],
  },
  {
    path: 'pages',
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
          { path: 'search_analytics', component: PageDetailsSearchAnalyticsComponent },
          { path: 'feedback', component: PageDetailsFeedbackComponent },
        ],
      }
    ],
  },
  {
    path: 'tasks',
    component: TasksComponent,
    children: [
      { path: '', component: TasksHomeComponent, pathMatch: 'full' },
      {
        path: 'details/:id',
        component: TaskDetailsComponent,
        children: [
          { path: '', redirectTo: 'summary', pathMatch: 'full' },
          { path: 'summary', component: TaskDetailsSummaryComponent },
          { path: 'webtraffic', component: TaskDetailsWebtrafficComponent },
          { path: 'search_analytics', component: TaskDetailsSearchAnalyticsComponent },
          { path: 'feedback', component: TaskDetailsFeedbackComponent },
        ],
      }
    ],
  },
  {
    path: 'projects',
    component: ProjectsComponent, // now this
    children: [
      { path: '', component: ProjectsHomeComponent, pathMatch: 'full' },
      {
        path: 'details/:id',
        component: ProjectDetailsComponent,
        children: [
          { path: '', redirectTo: 'summary', pathMatch: 'full' },
          { path: 'summary', component: ProjectDetailsSummaryComponent },
          { path: 'webtraffic', component: ProjectDetailsWebtrafficComponent },
          { path: 'search_analytics', component: ProjectDetailsSearchAnalyticsComponent },
          { path: 'feedback', component: ProjectDetailsFeedbackComponent },
        ],
      }
    ],
  },

  // todo: add rest of views

  { path: '**', redirectTo: 'overview' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
