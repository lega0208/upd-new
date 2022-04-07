import { Action } from '@ngrx/store';

import * as ProjectsHomeActions from './projects-home.actions';
import { ProjectsHomeEntity } from './projects-home.models';
import { State, projectsHomeInitialState, reducer } from './projects-home.reducer';

describe('ProjectsHome Reducer', () => {
  const createProjectsHomeEntity = (
    id: string,
    name = ''
  ): ProjectsHomeEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid ProjectsHome actions', () => {
    it('loadProjectsHomeSuccess should return the list of known ProjectsHome', () => {
      const projectsHome = [
        createProjectsHomeEntity('PRODUCT-AAA'),
        createProjectsHomeEntity('PRODUCT-zzz'),
      ];
      const action = ProjectsHomeActions.loadProjectsHomeSuccess({
        projectsHome,
      });

      const result: State = reducer(projectsHomeInitialState, action);

      expect(result.loaded).toBe(true);
      expect(result.ids.length).toBe(2);
    });
  });

  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(projectsHomeInitialState, action);

      expect(result).toBe(projectsHomeInitialState);
    });
  });
});
