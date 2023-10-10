import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { readFirst } from '@nrwl/angular/testing';

import * as ReportsActions from './reports.actions';
import { ReportsEffects } from './reports.effects';
import { ReportsFacade } from './reports.facade';
import { ReportsEntity } from './reports.models';
import {
  REPORTS_FEATURE_KEY,
  ReportsState,
  initialReportsState,
  reportsReducer,
} from './reports.reducer';
import * as ReportsSelectors from './reports.selectors';

interface TestSchema {
  reports: ReportsState;
}

describe('ReportsFacade', () => {
  let facade: ReportsFacade;
  let store: Store<TestSchema>;
  const createReportsEntity = (id: string, name = ''): ReportsEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(REPORTS_FEATURE_KEY, reportsReducer),
          EffectsModule.forFeature([ReportsEffects]),
        ],
        providers: [ReportsFacade],
      })
      class CustomFeatureModule {}

      @NgModule({
        imports: [
          StoreModule.forRoot({}),
          EffectsModule.forRoot([]),
          CustomFeatureModule,
        ],
      })
      class RootModule {}
      TestBed.configureTestingModule({ imports: [RootModule] });

      store = TestBed.inject(Store);
      facade = TestBed.inject(ReportsFacade);
    });

    /**
     * The initially generated facade::loadAll() returns empty array
     */
    it('loadAll() should return empty list with loaded == true', async () => {
      let list = await readFirst(facade.allReports$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      facade.init();

      list = await readFirst(facade.allReports$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(true);
    });

    /**
     * Use `loadReportsSuccess` to manually update list
     */
    it('allReports$ should return the loaded list; and loaded flag == true', async () => {
      let list = await readFirst(facade.allReports$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      store.dispatch(
        ReportsActions.loadReportsSuccess({
          reports: [createReportsEntity('AAA'), createReportsEntity('BBB')],
        })
      );

      list = await readFirst(facade.allReports$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(2);
      expect(isLoaded).toBe(true);
    });
  });
});
