import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { I18nModule } from '@dua-upd/upd/i18n';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ServicesModule } from '@dua-upd/upd/services';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ReportsEffects } from './+state/reports.effects';
import { ReportsFacade } from './+state/reports.facade';
import { REPORTS_FEATURE_KEY, reportsReducer } from './+state/reports.reducer';
import { UpdComponentsModule } from '@dua-upd/upd-components';

@NgModule({
  imports: [
    I18nModule,
    CommonModule,
    UpdComponentsModule,
    ServicesModule,
    StoreModule.forFeature(REPORTS_FEATURE_KEY, reportsReducer),
    EffectsModule.forFeature([ReportsEffects]),
    RouterModule.forChild([
      { path: '', pathMatch: 'full', component: ReportsComponent },
    ]),
    NgbModule,
  ],
  declarations: [ReportsComponent],
  providers: [ReportsFacade],
})
export class ReportsModule {}
