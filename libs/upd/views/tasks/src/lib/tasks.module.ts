import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { UpdComponentsModule } from '@cra-arc/upd-components';
import { ApiService, ServicesModule } from '@cra-arc/upd/services';

import { TasksComponent } from './tasks.component';
import { TasksHomeComponent } from './tasks-home/tasks-home.component';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { TaskDetailsSummaryComponent } from './task-details/task-details-summary/task-details-summary.component';
import { TaskDetailsWebtrafficComponent } from './task-details/task-details-webtraffic/task-details-webtraffic.component';
import { TaskDetailsSearchAnalyticsComponent } from './task-details/task-details-search-analytics/task-details-search-analytics.component';
import { TaskDetailsFeedbackComponent } from './task-details/task-details-feedback/task-details-feedback.component';
import { TaskDetailsCalldriversComponent } from './task-details/task-details-calldrivers/task-details-calldrivers.component';
import { TaskDetailsUxTestsComponent } from './task-details/task-details-ux-tests/task-details-ux-tests.component';
import { TasksRoutingModule } from './tasks-routing.module';

import {
  tasksHomeReducer,
  TASKS_HOME_FEATURE_KEY,
} from './tasks-home/+state/tasks-home.reducer';
import { TasksHomeEffects } from './tasks-home/+state/tasks-home.effects';
import { TasksHomeFacade } from './tasks-home/+state/tasks-home.facade';

import {
  tasksDetailsReducer,
  TASKS_DETAILS_FEATURE_KEY,
} from './task-details/+state/tasks-details.reducer';
import { TasksDetailsEffects } from './task-details/+state/tasks-details.effects';
import { TasksDetailsFacade } from './task-details/+state/tasks-details.facade';

@NgModule({
  imports: [
    CommonModule,
    UpdComponentsModule,
    TasksRoutingModule,
    ServicesModule,
    StoreModule.forFeature(TASKS_HOME_FEATURE_KEY, tasksHomeReducer),
    EffectsModule.forFeature([TasksHomeEffects]),
    StoreModule.forFeature(TASKS_DETAILS_FEATURE_KEY, tasksDetailsReducer),
    EffectsModule.forFeature([TasksDetailsEffects]),
  ],
  declarations: [
    TasksComponent,
    TasksHomeComponent,
    TaskDetailsComponent,
    TaskDetailsSummaryComponent,
    TaskDetailsWebtrafficComponent,
    TaskDetailsSearchAnalyticsComponent,
    TaskDetailsFeedbackComponent,
    TaskDetailsCalldriversComponent,
    TaskDetailsUxTestsComponent,
  ],
  providers: [ApiService, TasksHomeFacade, TasksDetailsFacade],
})
export class TasksModule {}
