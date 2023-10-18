import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nx/angular';
import { readFirst } from '@nx/angular/testing';

import * as PagesHomeActions from './pages-home.actions';
import { PagesHomeEffects } from './pages-home.effects';
import { PagesHomeFacade } from './pages-home.facade';
import { PagesHomeEntity } from './pages-home.models';
import {
  PAGES_HOME_FEATURE_KEY,
  State,
  pagesHomeInitialState,
  reducer,
} from './pages-home.reducer';
import * as PagesHomeSelectors from './pages-home.selectors';

interface TestSchema {
  pagesHome: State;
}

describe('PagesHomeFacade', () => {
  let facade: PagesHomeFacade;
  let store: Store<TestSchema>;
  const createPagesHomeEntity = (id: string, name = ''): PagesHomeEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(PAGES_HOME_FEATURE_KEY, reducer),
          EffectsModule.forFeature([PagesHomeEffects]),
        ],
        providers: [PagesHomeFacade],
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
      facade = TestBed.inject(PagesHomeFacade);
    });

    /**
     * The initially generated facade::loadAll() returns empty array
     */
    it('loadAll() should return empty list with loaded == true', async () => {
      let list = await readFirst(facade.allPagesHome$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      facade.init();

      list = await readFirst(facade.allPagesHome$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(true);
    });

    /**
     * Use `loadPagesHomeSuccess` to manually update list
     */
    it('allPagesHome$ should return the loaded list; and loaded flag == true', async () => {
      let list = await readFirst(facade.allPagesHome$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      store.dispatch(
        PagesHomeActions.loadPagesHomeSuccess({
          pagesHome: [
            createPagesHomeEntity('AAA'),
            createPagesHomeEntity('BBB'),
          ],
        })
      );

      list = await readFirst(facade.allPagesHome$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(2);
      expect(isLoaded).toBe(true);
    });
  });
});
