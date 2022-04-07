import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nrwl/angular';
import { readFirst } from '@nrwl/angular/testing';

import * as ProjectsHomeActions from './projects-home.actions';
import { ProjectsHomeEffects } from './projects-home.effects';
import { ProjectsHomeFacade } from './projects-home.facade';
import { ProjectsHomeEntity } from './projects-home.models';
import {
  PROJECTS_HOME_FEATURE_KEY,
  State,
  projectsHomeInitialState,
  reducer,
} from './projects-home.reducer';
import * as ProjectsHomeSelectors from './projects-home.selectors';

interface TestSchema {
  projectsHome: State;
}

describe('ProjectsHomeFacade', () => {
  let facade: ProjectsHomeFacade;
  let store: Store<TestSchema>;
  const createProjectsHomeEntity = (
    id: string,
    name = ''
  ): ProjectsHomeEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(PROJECTS_HOME_FEATURE_KEY, reducer),
          EffectsModule.forFeature([ProjectsHomeEffects]),
        ],
        providers: [ProjectsHomeFacade],
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
      facade = TestBed.inject(ProjectsHomeFacade);
    });

    /**
     * The initially generated facade::loadAll() returns empty array
     */
    it('loadAll() should return empty list with loaded == true', async () => {
      let list = await readFirst(facade.allProjectsHome$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      facade.init();

      list = await readFirst(facade.allProjectsHome$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(true);
    });

    /**
     * Use `loadProjectsHomeSuccess` to manually update list
     */
    it('allProjectsHome$ should return the loaded list; and loaded flag == true', async () => {
      let list = await readFirst(facade.allProjectsHome$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      store.dispatch(
        ProjectsHomeActions.loadProjectsHomeSuccess({
          projectsHome: [
            createProjectsHomeEntity('AAA'),
            createProjectsHomeEntity('BBB'),
          ],
        })
      );

      list = await readFirst(facade.allProjectsHome$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(2);
      expect(isLoaded).toBe(true);
    });
  });
});
