import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nx/angular';
import { readFirst } from '@nx/angular/testing';

import * as DateSelectionActions from './date-selection.actions';
import { DateSelectionEffects } from './date-selection.effects';
import { DateSelectionFacade } from './date-selection.facade';
import { DateSelectionEntity } from './date-selection.models';
import {
  DATE_SELECTION_FEATURE_KEY,
  State,
  initialState,
  reducer,
} from './date-selection.reducer';
import * as DateSelectionSelectors from './date-selection.selectors';

interface TestSchema {
  dateSelection: State;
}

describe('DateSelectionFacade', () => {
  let facade: DateSelectionFacade;
  let store: Store<TestSchema>;
  const createDateSelectionEntity = (
    id: string,
    name = ''
  ): DateSelectionEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(DATE_SELECTION_FEATURE_KEY, reducer),
          EffectsModule.forFeature([DateSelectionEffects]),
        ],
        providers: [DateSelectionFacade],
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
      facade = TestBed.inject(DateSelectionFacade);
    });

    /**
     * The initially generated facade::loadAll() returns empty array
     */
    it('loadAll() should return empty list with loaded == true', async () => {
      let list = await readFirst(facade.allDateSelection$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      facade.init();

      list = await readFirst(facade.allDateSelection$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(true);
    });

    /**
     * Use `loadDateSelectionSuccess` to manually update list
     */
    it('allDateSelection$ should return the loaded list; and loaded flag == true', async () => {
      let list = await readFirst(facade.allDateSelection$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      store.dispatch(
        DateSelectionActions.loadDateSelectionSuccess({
          dateSelection: [
            createDateSelectionEntity('AAA'),
            createDateSelectionEntity('BBB'),
          ],
        })
      );

      list = await readFirst(facade.allDateSelection$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(2);
      expect(isLoaded).toBe(true);
    });
  });
});
