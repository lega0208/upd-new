import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nrwl/angular';
import { readFirst } from '@nrwl/angular/testing';

import * as OverviewActions from './overview.actions';
import { OverviewEffects } from './overview.effects';
import { OverviewFacade } from './overview.facade';
import { OverviewData } from './overview.models';
import {
  OVERVIEW_FEATURE_KEY,
  OverviewState,
  initialState,
  reducer,
} from './overview.reducer';
import * as OverviewSelectors from './overview.selectors';

interface TestSchema {
  overview: OverviewState;
}

describe('OverviewFacade', () => {
  let facade: OverviewFacade;
  let store: Store<TestSchema>;
  const createOverviewEntity = (id: string, name = ''): OverviewData => ({
    id,
    name: name || `name-${id}`,
  });

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(OVERVIEW_FEATURE_KEY, reducer),
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

      store = TestBed.inject(Store);
      facade = TestBed.inject(OverviewFacade);
    });

    /**
     * The initially generated facade::loadAll() returns empty array
     */
    it('loadAll() should return empty list with loaded == true', async () => {
      let list = await readFirst(facade.overviewData$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      facade.init();

      list = await readFirst(facade.overviewData$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(true);
    });

    /**
     * Use `loadOverviewSuccess` to manually update list
     */
    it('allOverview$ should return the loaded list; and loaded flag == true', async () => {
      let list = await readFirst(facade.overviewData$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      store.dispatch(
        OverviewActions.loadOverviewSuccess({
          overview: [createOverviewEntity('AAA'), createOverviewEntity('BBB')],
        })
      );

      list = await readFirst(facade.overviewData$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(2);
      expect(isLoaded).toBe(true);
    });
  });
});
