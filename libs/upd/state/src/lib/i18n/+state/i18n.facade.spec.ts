import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nrwl/angular';
import { readFirst } from '@nrwl/angular/testing';

import * as I18nActions from './i18n.actions';
import { I18nEffects } from './i18n.effects';
import { I18nFacade } from './i18n.facade';
import { I18nEntity } from './i18n.models';
import { I18N_FEATURE_KEY, State, i18nInitialState, reducer } from './i18n.reducer';
import * as I18nSelectors from './i18n.selectors';

interface TestSchema {
  i18n: State;
}

describe('I18nFacade', () => {
  let facade: I18nFacade;
  let store: Store<TestSchema>;
  const createI18nEntity = (id: string, name = ''): I18nEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(I18N_FEATURE_KEY, reducer),
          EffectsModule.forFeature([I18nEffects]),
        ],
        providers: [I18nFacade],
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
      facade = TestBed.inject(I18nFacade);
    });

    /**
     * The initially generated facade::loadAll() returns empty array
     */
    it('loadAll() should return empty list with loaded == true', async () => {
      let list = await readFirst(facade.allI18n$);
      let isLoaded = await readFirst(facade.currentLang$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      facade.init();

      list = await readFirst(facade.allI18n$);
      isLoaded = await readFirst(facade.currentLang$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(true);
    });

    /**
     * Use `loadI18nSuccess` to manually update list
     */
    it('allI18n$ should return the loaded list; and loaded flag == true', async () => {
      let list = await readFirst(facade.allI18n$);
      let isLoaded = await readFirst(facade.currentLang$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      store.dispatch(
        I18nActions.loadI18nSuccess({
          i18n: [createI18nEntity('AAA'), createI18nEntity('BBB')],
        })
      );

      list = await readFirst(facade.allI18n$);
      isLoaded = await readFirst(facade.currentLang$);

      expect(list.length).toBe(2);
      expect(isLoaded).toBe(true);
    });
  });
});
