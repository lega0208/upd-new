import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TasksComponent } from './tasks.component';
import { TasksHomeComponent } from './tasks-home/tasks-home.component';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { TaskDetailsSummaryComponent } from './task-details/task-details-summary/task-details-summary.component';
import { TaskDetailsWebtrafficComponent } from './task-details/task-details-webtraffic/task-details-webtraffic.component';
import { TaskDetailsSearchAnalyticsComponent } from './task-details/task-details-search-analytics/task-details-search-analytics.component';
import { TaskDetailsFeedbackComponent } from './task-details/task-details-feedback/task-details-feedback.component';
import { TaskDetailsCalldriversComponent } from './task-details/task-details-calldrivers/task-details-calldrivers.component';
import { TaskDetailsUxTestsComponent } from './task-details/task-details-ux-tests/task-details-ux-tests.component';

const routes: Routes = [
  {
    path: '',
    component: TasksComponent,
    children: [
      { path: '', component: TasksHomeComponent, pathMatch: 'full' },
      {
        path: ':id',
        component: TaskDetailsComponent,
        children: [
          { path: '', redirectTo: 'summary', pathMatch: 'full' },
          { path: 'summary', component: TaskDetailsSummaryComponent },
          { path: 'webtraffic', component: TaskDetailsWebtrafficComponent },
          {
            path: 'searchanalytics',
            component: TaskDetailsSearchAnalyticsComponent,
          },
          { path: 'pagefeedback', component: TaskDetailsFeedbackComponent },
          { path: 'calldrivers', component: TaskDetailsCalldriversComponent },
          { path: 'uxtests', component: TaskDetailsUxTestsComponent },
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
