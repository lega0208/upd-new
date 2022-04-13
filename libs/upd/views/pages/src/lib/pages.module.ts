import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UpdComponentsModule } from '@cra-arc/upd-components';

import { PagesRoutingModule } from './pages-routing.module';
import { PagesComponent } from './pages.component';
import { PagesHomeComponent } from './pages-home/pages-home.component';
import { PagesDetailsComponent } from './pages-details/pages-details.component';
import { PagesDetailsSummaryComponent } from './pages-details/pages-details-summary/pages-details-summary.component';
import { PagesDetailsWebtrafficComponent } from './pages-details/pages-details-webtraffic/pages-details-webtraffic.component';
import { PagesDetailsSearchAnalyticsComponent } from './pages-details/pages-details-search-analytics/pages-details-search-analytics.component';
import { PagesDetailsFeedbackComponent } from './pages-details/pages-details-feedback/pages-details-feedback.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import {
  pagesHomeReducer,
  PAGES_HOME_FEATURE_KEY,
} from './pages-home/+state/pages-home.reducer';
import { PagesHomeEffects } from './pages-home/+state/pages-home.effects';
import { PagesHomeFacade } from './pages-home/+state/pages-home.facade';
import {
  pagesDetailsReducer,
  PAGES_DETAILS_FEATURE_KEY,
} from './pages-details/+state/pages-details.reducer';
import { PagesDetailsEffects } from './pages-details/+state/pages-details.effects';
import { PagesDetailsFacade } from './pages-details/+state/pages-details.facade';
import { ServicesModule, ApiService } from '@cra-arc/upd/services';
import { ClipboardModule } from '@angular/cdk/clipboard';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
@NgModule({
  imports: [
    CommonModule,
    PagesRoutingModule,
    UpdComponentsModule,
    ClipboardModule,
    HttpClientModule,
    TranslateModule.forChild({
      defaultLanguage: 'en-CA',
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
    }),
    StoreModule.forFeature(PAGES_HOME_FEATURE_KEY, pagesHomeReducer),
    EffectsModule.forFeature([PagesHomeEffects]),
    StoreModule.forFeature(PAGES_DETAILS_FEATURE_KEY, pagesDetailsReducer),
    EffectsModule.forFeature([PagesDetailsEffects]),
    ServicesModule,
  ],
  declarations: [
    PagesComponent,
    PagesHomeComponent,
    PagesDetailsComponent,
    PagesDetailsSummaryComponent,
    PagesDetailsWebtrafficComponent,
    PagesDetailsSearchAnalyticsComponent,
    PagesDetailsFeedbackComponent,
  ],
  providers: [PagesHomeFacade, PagesDetailsFacade, ApiService],
})
export class PagesModule {}
