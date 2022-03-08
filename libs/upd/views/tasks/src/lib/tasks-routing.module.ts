import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TasksComponent } from './tasks.component';
import { TasksHomeComponent } from './tasks-home/tasks-home.component';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { TaskDetailsSummaryComponent } from './task-details/task-details-summary/task-details-summary.component';
import { TaskDetailsWebtrafficComponent } from './task-details/task-details-webtraffic/task-details-webtraffic.component';
import { TaskDetailsSearchAnalyticsComponent } from './task-details/task-details-search-analytics/task-details-search-analytics.component';
import { TaskDetailsFeedbackComponent } from './task-details/task-details-feedback/task-details-feedback.component';

const routes: Routes = [
  {
    path: '',
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
          {
            path: 'search_analytics',
            component: TaskDetailsSearchAnalyticsComponent,
          },
          { path: 'feedback', component: TaskDetailsFeedbackComponent },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksRoutingModule {}
