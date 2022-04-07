import { TasksHomeEntity } from './tasks-home.models';
import {
  tasksHomeAdapter,
  TasksHomePartialState,
  tasksHomeInitialState,
} from './tasks-home.reducer';
import * as TasksHomeSelectors from './tasks-home.selectors';

describe('TasksHome Selectors', () => {
  const ERROR_MSG = 'No Error Available';
  const getTasksHomeId = (it: TasksHomeEntity) => it.id;
  const createTasksHomeEntity = (id: string, name = '') =>
    ({
      id,
      name: name || `name-${id}`,
    } as TasksHomeEntity);

  let state: TasksHomePartialState;

  beforeEach(() => {
    state = {
      tasksHome: tasksHomeAdapter.setAll(
        [
          createTasksHomeEntity('PRODUCT-AAA'),
          createTasksHomeEntity('PRODUCT-BBB'),
          createTasksHomeEntity('PRODUCT-CCC'),
        ],
        {
          ...tasksHomeInitialState,
          selectedId: 'PRODUCT-BBB',
          error: ERROR_MSG,
          loaded: true,
        }
      ),
    };
  });

  describe('TasksHome Selectors', () => {
    it('getAllTasksHome() should return the list of TasksHome', () => {
      const results = TasksHomeSelectors.getAllTasksHome(state);
      const selId = getTasksHomeId(results[1]);

      expect(results.length).toBe(3);
      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getSelected() should return the selected Entity', () => {
      const result = TasksHomeSelectors.getSelected(state) as TasksHomeEntity;
      const selId = getTasksHomeId(result);

      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getTasksHomeLoaded() should return the current "loaded" status', () => {
      const result = TasksHomeSelectors.getTasksHomeLoaded(state);

      expect(result).toBe(true);
    });

    it('getTasksHomeError() should return the current "error" state', () => {
      const result = TasksHomeSelectors.getTasksHomeError(state);

      expect(result).toBe(ERROR_MSG);
    });
  });
});
