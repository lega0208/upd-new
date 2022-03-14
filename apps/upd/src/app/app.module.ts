import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { StoreRouterConnectingModule } from '@ngrx/router-store';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

import { overviewReducer } from '@cra-arc/upd/views/overview';

import { DateSelectionEffects } from '@cra-arc/upd/state';
import { DateSelectionFacade } from '@cra-arc/upd/state';
import {
  dateSelectionReducer,
  DATE_SELECTION_FEATURE_KEY,
} from '@cra-arc/upd/state';

import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent, HeaderComponent, SidebarComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    StoreModule.forRoot(
      {
        overview: overviewReducer,
        dateSelection: dateSelectionReducer,
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
  ],
  providers: [DateSelectionFacade],
  bootstrap: [AppComponent],
})
export class AppModule {}
