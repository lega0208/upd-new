import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UpdComponentsModule } from '@cra-arc/upd-components';
import { TasksComponent } from './tasks.component';
import { TasksHomeComponent } from './tasks-home/tasks-home.component';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { TaskDetailsSummaryComponent } from './task-details/task-details-summary/task-details-summary.component';
import { TaskDetailsWebtrafficComponent } from './task-details/task-details-webtraffic/task-details-webtraffic.component';
import { TaskDetailsSearchAnalyticsComponent } from './task-details/task-details-search-analytics/task-details-search-analytics.component';
import { TaskDetailsFeedbackComponent } from './task-details/task-details-feedback/task-details-feedback.component';
import { TasksRoutingModule } from './tasks-routing.module';

@NgModule({
  imports: [
    CommonModule,
    UpdComponentsModule,
    TasksRoutingModule,
  ],
  declarations: [
    TasksComponent,
    TasksHomeComponent,
    TaskDetailsComponent,
    TaskDetailsSummaryComponent,
    TaskDetailsWebtrafficComponent,
    TaskDetailsSearchAnalyticsComponent,
    TaskDetailsFeedbackComponent,
  ]
})
export class TasksModule {}
