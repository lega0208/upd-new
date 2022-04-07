import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nrwl/angular';
import { readFirst } from '@nrwl/angular/testing';

import * as TasksDetailsActions from './tasks-details.actions';
import { TasksDetailsEffects } from './tasks-details.effects';
import { TasksDetailsFacade } from './tasks-details.facade';
import { TasksDetailsEntity } from './tasks-details.models';
import {
  TASKS_DETAILS_FEATURE_KEY,
  State,
  tasksDetailsInitialState,
  reducer,
} from './tasks-details.reducer';
import * as TasksDetailsSelectors from './tasks-details.selectors';

interface TestSchema {
  tasksDetails: State;
}

describe('TasksDetailsFacade', () => {
  let facade: TasksDetailsFacade;
  let store: Store<TestSchema>;
  const createTasksDetailsEntity = (
    id: string,
    name = ''
  ): TasksDetailsEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(TASKS_DETAILS_FEATURE_KEY, reducer),
          EffectsModule.forFeature([TasksDetailsEffects]),
        ],
        providers: [TasksDetailsFacade],
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
      facade = TestBed.inject(TasksDetailsFacade);
    });

    /**
     * The initially generated facade::loadAll() returns empty array
     */
    it('loadAll() should return empty list with loaded == true', async () => {
      let list = await readFirst(facade.allTasksDetails$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      facade.init();

      list = await readFirst(facade.allTasksDetails$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(true);
    });

    /**
     * Use `loadTasksDetailsSuccess` to manually update list
     */
    it('allTasksDetails$ should return the loaded list; and loaded flag == true', async () => {
      let list = await readFirst(facade.allTasksDetails$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      store.dispatch(
        TasksDetailsActions.loadTasksDetailsSuccess({
          tasksDetails: [
            createTasksDetailsEntity('AAA'),
            createTasksDetailsEntity('BBB'),
          ],
        })
      );

      list = await readFirst(facade.allTasksDetails$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(2);
      expect(isLoaded).toBe(true);
    });
  });
});
