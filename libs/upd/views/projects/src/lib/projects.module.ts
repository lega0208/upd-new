import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { UpdComponentsModule } from '@cra-arc/upd-components';
import { ApiService, ServicesModule } from '@cra-arc/upd/services';

import { ProjectsComponent } from './projects.component';
import { ProjectsHomeComponent } from './projects-home/projects-home.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { ProjectDetailsSummaryComponent } from './project-details/project-details-summary/project-details-summary.component';
import { ProjectDetailsWebtrafficComponent } from './project-details/project-details-webtraffic/project-details-webtraffic.component';
import { ProjectDetailsSearchAnalyticsComponent } from './project-details/project-details-search-analytics/project-details-search-analytics.component';
import { ProjectDetailsFeedbackComponent } from './project-details/project-details-feedback/project-details-feedback.component';
import { ProjectDetailsCalldriversComponent } from './project-details/project-details-calldrivers/project-details-calldrivers.component';
import { ProjectsRoutingModule } from './projects-routing.module';

import {
  projectsHomeReducer,
  PROJECTS_HOME_FEATURE_KEY,
} from './projects-home/+state/projects-home.reducer';
import { ProjectsHomeEffects } from './projects-home/+state/projects-home.effects';
import { ProjectsHomeFacade } from './projects-home/+state/projects-home.facade';

import {
  projectsDetailsReducer,
  PROJECTS_DETAILS_FEATURE_KEY,
} from './project-details/+state/projects-details.reducer';
import { ProjectsDetailsEffects } from './project-details/+state/projects-details.effects';
import { ProjectsDetailsFacade } from './project-details/+state/projects-details.facade';
import { ProjectDetailsDetailsComponent } from './project-details/project-details-details/project-details-details.component';
import { ProjectDetailsUxTestsComponent } from './project-details/project-details-ux-tests/project-details-ux-tests.component';

@NgModule({
  imports: [
    CommonModule,
    ProjectsRoutingModule,
    UpdComponentsModule,
    ServicesModule,
    StoreModule.forFeature(PROJECTS_HOME_FEATURE_KEY, projectsHomeReducer),
    EffectsModule.forFeature([ProjectsHomeEffects]),
    StoreModule.forFeature(
      PROJECTS_DETAILS_FEATURE_KEY,
      projectsDetailsReducer
    ),
    EffectsModule.forFeature([ProjectsDetailsEffects]),
  ],
  declarations: [
    ProjectsComponent,
    ProjectsHomeComponent,
    ProjectDetailsComponent,
    ProjectDetailsSummaryComponent,
    ProjectDetailsWebtrafficComponent,
    ProjectDetailsSearchAnalyticsComponent,
    ProjectDetailsFeedbackComponent,
    ProjectDetailsUxTestsComponent,
    ProjectDetailsCalldriversComponent,
    ProjectDetailsDetailsComponent,
  ],
  providers: [ProjectsHomeFacade, ProjectsDetailsFacade, ApiService],
})
export class ProjectsModule {}
