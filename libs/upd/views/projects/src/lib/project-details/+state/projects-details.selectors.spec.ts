import { ProjectsDetailsEntity } from './projects-details.models';
import {
  projectsDetailsAdapter,
  ProjectsDetailsPartialState,
  projectDetailsInitialState,
} from './projects-details.reducer';
import * as ProjectsDetailsSelectors from './projects-details.selectors';

describe('ProjectsDetails Selectors', () => {
  const ERROR_MSG = 'No Error Available';
  const getProjectsDetailsId = (it: ProjectsDetailsEntity) => it.id;
  const createProjectsDetailsEntity = (id: string, name = '') =>
    ({
      id,
      name: name || `name-${id}`,
    } as ProjectsDetailsEntity);

  let state: ProjectsDetailsPartialState;

  beforeEach(() => {
    state = {
      projectsDetails: projectsDetailsAdapter.setAll(
        [
          createProjectsDetailsEntity('PRODUCT-AAA'),
          createProjectsDetailsEntity('PRODUCT-BBB'),
          createProjectsDetailsEntity('PRODUCT-CCC'),
        ],
        {
          ...projectDetailsInitialState,
          selectedId: 'PRODUCT-BBB',
          error: ERROR_MSG,
          loaded: true,
        }
      ),
    };
  });

  describe('ProjectsDetails Selectors', () => {
    it('getAllProjectsDetails() should return the list of ProjectsDetails', () => {
      const results = ProjectsDetailsSelectors.getAllProjectsDetails(state);
      const selId = getProjectsDetailsId(results[1]);

      expect(results.length).toBe(3);
      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getSelected() should return the selected Entity', () => {
      const result = ProjectsDetailsSelectors.getSelected(
        state
      ) as ProjectsDetailsEntity;
      const selId = getProjectsDetailsId(result);

      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getProjectsDetailsLoaded() should return the current "loaded" status', () => {
      const result = ProjectsDetailsSelectors.selectProjectsDetailsLoaded(state);

      expect(result).toBe(true);
    });

    it('getProjectsDetailsError() should return the current "error" state', () => {
      const result = ProjectsDetailsSelectors.selectProjectsDetailsError(state);

      expect(result).toBe(ERROR_MSG);
    });
  });
});
