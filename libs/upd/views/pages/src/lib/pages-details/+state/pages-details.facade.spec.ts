import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nx/angular';
import { readFirst } from '@nx/angular/testing';

import * as PagesDetailsActions from './pages-details.actions';
import { PagesDetailsEffects } from './pages-details.effects';
import { PagesDetailsFacade } from './pages-details.facade';
import { PagesDetailsEntity } from './pages-details.models';
import {
  PAGES_DETAILS_FEATURE_KEY,
  State,
  pagesDetailsInitialState,
  reducer,
} from './pages-details.reducer';
import * as PagesDetailsSelectors from './pages-details.selectors';

interface TestSchema {
  pagesDetails: State;
}

describe('PagesDetailsFacade', () => {
  let facade: PagesDetailsFacade;
  let store: Store<TestSchema>;
  const createPagesDetailsEntity = (
    id: string,
    name = ''
  ): PagesDetailsEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(PAGES_DETAILS_FEATURE_KEY, reducer),
          EffectsModule.forFeature([PagesDetailsEffects]),
        ],
        providers: [PagesDetailsFacade],
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
      facade = TestBed.inject(PagesDetailsFacade);
    });

    /**
     * The initially generated facade::loadAll() returns empty array
     */
    it('loadAll() should return empty list with loaded == true', async () => {
      let list = await readFirst(facade.allPagesDetails$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      facade.init();

      list = await readFirst(facade.allPagesDetails$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(true);
    });

    /**
     * Use `loadPagesDetailsSuccess` to manually update list
     */
    it('allPagesDetails$ should return the loaded list; and loaded flag == true', async () => {
      let list = await readFirst(facade.allPagesDetails$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      store.dispatch(
        PagesDetailsActions.loadPagesDetailsSuccess({
          pagesDetails: [
            createPagesDetailsEntity('AAA'),
            createPagesDetailsEntity('BBB'),
          ],
        })
      );

      list = await readFirst(facade.allPagesDetails$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(2);
      expect(isLoaded).toBe(true);
    });
  });
});
