import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nrwl/angular';
import { readFirst } from '@nrwl/angular/testing';

import * as TasksHomeActions from './tasks-home.actions';
import { TasksHomeEffects } from './tasks-home.effects';
import { TasksHomeFacade } from './tasks-home.facade';
import { TasksHomeEntity } from './tasks-home.models';
import {
  TASKS_HOME_FEATURE_KEY,
  State,
  tasksHomeInitialState,
  reducer,
} from './tasks-home.reducer';
import * as TasksHomeSelectors from './tasks-home.selectors';

interface TestSchema {
  tasksHome: State;
}

describe('TasksHomeFacade', () => {
  let facade: TasksHomeFacade;
  let store: Store<TestSchema>;
  const createTasksHomeEntity = (id: string, name = ''): TasksHomeEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(TASKS_HOME_FEATURE_KEY, reducer),
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

    /**
     * The initially generated facade::loadAll() returns empty array
     */
    it('loadAll() should return empty list with loaded == true', async () => {
      let list = await readFirst(facade.allTasksHome$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      facade.init();

      list = await readFirst(facade.allTasksHome$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(true);
    });

    /**
     * Use `loadTasksHomeSuccess` to manually update list
     */
    it('allTasksHome$ should return the loaded list; and loaded flag == true', async () => {
      let list = await readFirst(facade.allTasksHome$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      store.dispatch(
        TasksHomeActions.loadTasksHomeSuccess({
          tasksHome: [
            createTasksHomeEntity('AAA'),
            createTasksHomeEntity('BBB'),
          ],
        })
      );

      list = await readFirst(facade.allTasksHome$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(2);
      expect(isLoaded).toBe(true);
    });
  });
});
