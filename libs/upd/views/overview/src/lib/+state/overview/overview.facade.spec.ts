import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nrwl/angular';
import { readFirst } from '@nrwl/angular/testing';

import * as OverviewActions from './overview.actions';
import { OverviewEffects } from './overview.effects';
import { OverviewFacade } from './overview.facade';
import {
  OVERVIEW_FEATURE_KEY,
  OverviewState,
  overviewReducer,
} from './overview.reducer';

interface TestSchema {
  overview: OverviewState;
}

describe('OverviewFacade', () => {
  let facade: OverviewFacade;
  let store: Store;

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(OVERVIEW_FEATURE_KEY, overviewReducer),
          EffectsModule.forFeature([OverviewEffects]),
        ],
        providers: [OverviewFacade],
      })
      class CustomFeatureModule {}

      @NgModule({
        imports: [
          NxModule.forRoot(),
          StoreModule.forRoot({}),
          EffectsModule.forRoot([]),
          CustomFeatureModule,
        ],
      })
      class RootModule {}
      TestBed.configureTestingModule({ imports: [RootModule] });
    });
  });
});
