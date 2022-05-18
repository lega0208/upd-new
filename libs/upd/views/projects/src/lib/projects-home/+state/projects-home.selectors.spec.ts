import { ProjectsHomeEntity } from './projects-home.models';
import {
  projectsHomeAdapter,
  ProjectsHomePartialState,
  projectsHomeInitialState,
} from './projects-home.reducer';
import * as ProjectsHomeSelectors from './projects-home.selectors';

describe('ProjectsHome Selectors', () => {
  const ERROR_MSG = 'No Error Available';
  const getProjectsHomeId = (it: ProjectsHomeEntity) => it.id;
  const createProjectsHomeEntity = (id: string, name = '') =>
    ({
      id,
      name: name || `name-${id}`,
    } as ProjectsHomeEntity);

  let state: ProjectsHomePartialState;

  beforeEach(() => {
    state = {
      projectsHome: projectsHomeAdapter.setAll(
        [
          createProjectsHomeEntity('PRODUCT-AAA'),
          createProjectsHomeEntity('PRODUCT-BBB'),
          createProjectsHomeEntity('PRODUCT-CCC'),
        ],
        {
          ...projectsHomeInitialState,
          selectedId: 'PRODUCT-BBB',
          error: ERROR_MSG,
          loaded: true,
        }
      ),
    };
  });

  describe('ProjectsHome Selectors', () => {
    it('getAllProjectsHome() should return the list of ProjectsHome', () => {
      const results = ProjectsHomeSelectors.getAllProjectsHome(state);
      const selId = getProjectsHomeId(results[1]);

      expect(results.length).toBe(3);
      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getSelected() should return the selected Entity', () => {
      const result = ProjectsHomeSelectors.getSelected(
        state
      ) as ProjectsHomeEntity;
      const selId = getProjectsHomeId(result);

      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getProjectsHomeLoaded() should return the current "loaded" status', () => {
      const result = ProjectsHomeSelectors.selectProjectsHomeLoaded(state);

      expect(result).toBe(true);
    });

    it('getProjectsHomeError() should return the current "error" state', () => {
      const result = ProjectsHomeSelectors.selectProjectsHomeError(state);

      expect(result).toBe(ERROR_MSG);
    });
  });
});
