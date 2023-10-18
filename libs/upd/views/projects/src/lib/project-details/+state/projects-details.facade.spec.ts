import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule, Store } from '@ngrx/store';
import { NxModule } from '@nx/angular';
import { readFirst } from '@nx/angular/testing';

import * as ProjectsDetailsActions from './projects-details.actions';
import { ProjectsDetailsEffects } from './projects-details.effects';
import { ProjectsDetailsFacade } from './projects-details.facade';
import { ProjectsDetailsEntity } from './projects-details.models';
import {
  PROJECTS_DETAILS_FEATURE_KEY,
  State,
  projectDetailsInitialState,
  reducer,
} from './projects-details.reducer';
import * as ProjectsDetailsSelectors from './projects-details.selectors';

interface TestSchema {
  projectsDetails: State;
}

describe('ProjectsDetailsFacade', () => {
  let facade: ProjectsDetailsFacade;
  let store: Store<TestSchema>;
  const createProjectsDetailsEntity = (
    id: string,
    name = ''
  ): ProjectsDetailsEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('used in NgModule', () => {
    beforeEach(() => {
      @NgModule({
        imports: [
          StoreModule.forFeature(PROJECTS_DETAILS_FEATURE_KEY, reducer),
          EffectsModule.forFeature([ProjectsDetailsEffects]),
        ],
        providers: [ProjectsDetailsFacade],
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
      facade = TestBed.inject(ProjectsDetailsFacade);
    });

    /**
     * The initially generated facade::loadAll() returns empty array
     */
    it('loadAll() should return empty list with loaded == true', async () => {
      let list = await readFirst(facade.allProjectsDetails$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      facade.init();

      list = await readFirst(facade.allProjectsDetails$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(true);
    });

    /**
     * Use `loadProjectsDetailsSuccess` to manually update list
     */
    it('allProjectsDetails$ should return the loaded list; and loaded flag == true', async () => {
      let list = await readFirst(facade.allProjectsDetails$);
      let isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(0);
      expect(isLoaded).toBe(false);

      store.dispatch(
        ProjectsDetailsActions.loadProjectsDetailsSuccess({
          projectsDetails: [
            createProjectsDetailsEntity('AAA'),
            createProjectsDetailsEntity('BBB'),
          ],
        })
      );

      list = await readFirst(facade.allProjectsDetails$);
      isLoaded = await readFirst(facade.loaded$);

      expect(list.length).toBe(2);
      expect(isLoaded).toBe(true);
    });
  });
});
