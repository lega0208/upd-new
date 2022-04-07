import { TasksDetailsEntity } from './tasks-details.models';
import {
  tasksDetailsAdapter,
  TasksDetailsPartialState,
  tasksDetailsInitialState,
} from './tasks-details.reducer';
import * as TasksDetailsSelectors from './tasks-details.selectors';

describe('TasksDetails Selectors', () => {
  const ERROR_MSG = 'No Error Available';
  const getTasksDetailsId = (it: TasksDetailsEntity) => it.id;
  const createTasksDetailsEntity = (id: string, name = '') =>
    ({
      id,
      name: name || `name-${id}`,
    } as TasksDetailsEntity);

  let state: TasksDetailsPartialState;

  beforeEach(() => {
    state = {
      tasksDetails: tasksDetailsAdapter.setAll(
        [
          createTasksDetailsEntity('PRODUCT-AAA'),
          createTasksDetailsEntity('PRODUCT-BBB'),
          createTasksDetailsEntity('PRODUCT-CCC'),
        ],
        {
          ...tasksDetailsInitialState,
          selectedId: 'PRODUCT-BBB',
          error: ERROR_MSG,
          loaded: true,
        }
      ),
    };
  });

  describe('TasksDetails Selectors', () => {
    it('getAllTasksDetails() should return the list of TasksDetails', () => {
      const results = TasksDetailsSelectors.getAllTasksDetails(state);
      const selId = getTasksDetailsId(results[1]);

      expect(results.length).toBe(3);
      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getSelected() should return the selected Entity', () => {
      const result = TasksDetailsSelectors.getSelected(
        state
      ) as TasksDetailsEntity;
      const selId = getTasksDetailsId(result);

      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getTasksDetailsLoaded() should return the current "loaded" status', () => {
      const result = TasksDetailsSelectors.selectTasksDetailsLoaded(state);

      expect(result).toBe(true);
    });

    it('getTasksDetailsError() should return the current "error" state', () => {
      const result = TasksDetailsSelectors.selectTasksDetailsError(state);

      expect(result).toBe(ERROR_MSG);
    });
  });
});
