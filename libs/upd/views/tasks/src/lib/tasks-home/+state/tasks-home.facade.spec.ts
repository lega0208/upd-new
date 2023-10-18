import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nx/angular';
import { readFirst } from '@nx/angular/testing';

import * as TasksHomeActions from './tasks-home.actions';
import { TasksHomeEffects } from './tasks-home.effects';
import { TasksHomeFacade } from './tasks-home.facade';
import {
  TASKS_HOME_FEATURE_KEY,
  TasksHomeState,
  tasksHomeInitialState,
  tasksHomeReducer,
} from './tasks-home.reducer';
import * as TasksHomeSelectors from './tasks-home.selectors';

interface TestSchema {
  tasksHome: TasksHomeState;
}

describe('TasksHomeFacade', () => {
  let facade: TasksHomeFacade;
  let store: Store;

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(TASKS_HOME_FEATURE_KEY, tasksHomeReducer),
          EffectsModule.forFeature([TasksHomeEffects]),
        ],
        providers: [TasksHomeFacade],
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

      store = TestBed.inject(Store);
      facade = TestBed.inject(TasksHomeFacade);
    });
  });
});
