import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

import { I18nModule } from '@cra-arc/upd/i18n';

import {
  DateSelectionEffects,
  DateSelectionFacade,
  dateSelectionReducer,
  DATE_SELECTION_FEATURE_KEY,
  i18nReducer,
  I18N_FEATURE_KEY,
  I18nEffects,
  I18nFacade,
} from '@cra-arc/upd/state';

import { environment } from '../environments/environment';

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
        metaReducers: !environment.production ? [] : [],
        runtimeChecks: {
          strictActionImmutability: true,
          strictStateImmutability: true,
        },
      }
    ),
    StoreRouterConnectingModule.forRoot(),
    EffectsModule.forRoot([]),

    !environment.production ? StoreDevtoolsModule.instrument() : [],
    StoreModule.forFeature(DATE_SELECTION_FEATURE_KEY, dateSelectionReducer),
    EffectsModule.forFeature([DateSelectionEffects]),
    StoreModule.forFeature(I18N_FEATURE_KEY, i18nReducer),
    EffectsModule.forFeature([I18nEffects]),
  ],
  providers: [DateSelectionFacade, I18nFacade],
  bootstrap: [AppComponent],
})
export class AppModule {}
