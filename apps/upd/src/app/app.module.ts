import { NgModule } from '@angular/core';
import { LocationStrategy, NgOptimizedImage } from "@angular/common";
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ActionReducer, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import {
  type RouterReducerState,
  routerReducer,
  StoreRouterConnectingModule,
} from '@ngrx/router-store';
import { localStorageSync } from 'ngrx-store-localstorage';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

import { I18nModule } from '@dua-upd/upd/i18n';

import {
  DateSelectionEffects,
  DateSelectionFacade,
  dateSelectionReducer,
  i18nReducer,
  I18nEffects,
  I18nFacade,
  actionSanitizer,
  stateSanitizer,
  DateSelectionState,
  I18nState,
} from '@dua-upd/upd/state';

import { environment } from '../environments/environment';
import { PathPreserveQueryLocationStrategy } from '@dua-upd/upd/services';

import {
  NgxGoogleAnalyticsModule,
  NgxGoogleAnalyticsRouterModule,
} from 'ngx-google-analytics';

interface RootState {
  dateSelection: DateSelectionState;
  router: RouterReducerState;
  i18n: I18nState;
}

const localStorageSyncReducer = (
  reducer: ActionReducer<RootState>
): ActionReducer<RootState> =>
  localStorageSync({
    keys: ['dateSelection', 'router', 'i18n'],
    rehydrate: true,
  })(reducer);

@NgModule({
  declarations: [AppComponent, HeaderComponent, SidebarComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    I18nModule.forRoot(),
    BrowserAnimationsModule,
    AppRoutingModule,
    StoreModule.forRoot(
      {
        dateSelection: dateSelectionReducer,
        router: routerReducer,
        i18n: i18nReducer,
      },
      {
        metaReducers: !environment.production ? [localStorageSyncReducer] : [],
        runtimeChecks: {
          strictActionImmutability: true,
          strictStateImmutability: true,
        },
      }
    ),
    StoreRouterConnectingModule.forRoot(),
    EffectsModule.forRoot([DateSelectionEffects, I18nEffects]),
    !environment.production
      ? StoreDevtoolsModule.instrument({
          actionSanitizer,
          stateSanitizer,
        })
      : [],
    environment.production
      ? NgxGoogleAnalyticsModule.forRoot(environment.gaTrackingId)
      : [],
    environment.production ? NgxGoogleAnalyticsRouterModule : [],
    NgOptimizedImage,
  ],
  providers: [
    Title,
    DateSelectionFacade,
    I18nFacade,
    { provide: LocationStrategy, useClass: PathPreserveQueryLocationStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
