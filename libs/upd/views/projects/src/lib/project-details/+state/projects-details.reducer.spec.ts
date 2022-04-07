import { Action } from '@ngrx/store';

import * as ProjectsDetailsActions from './projects-details.actions';
import { ProjectsDetailsEntity } from './projects-details.models';
import { State, projectDetailsInitialState, reducer } from './projects-details.reducer';

describe('ProjectsDetails Reducer', () => {
  const createProjectsDetailsEntity = (
    id: string,
    name = ''
  ): ProjectsDetailsEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid ProjectsDetails actions', () => {
    it('loadProjectsDetailsSuccess should return the list of known ProjectsDetails', () => {
      const projectsDetails = [
        createProjectsDetailsEntity('PRODUCT-AAA'),
        createProjectsDetailsEntity('PRODUCT-zzz'),
      ];
      const action = ProjectsDetailsActions.loadProjectsDetailsSuccess({
        projectsDetails,
      });

      const result: State = reducer(projectDetailsInitialState, action);

      expect(result.loaded).toBe(true);
      expect(result.ids.length).toBe(2);
    });
  });

  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(projectDetailsInitialState, action);

      expect(result).toBe(projectDetailsInitialState);
    });
  });
});
