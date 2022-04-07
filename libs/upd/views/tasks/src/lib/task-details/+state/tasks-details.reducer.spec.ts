import { Action } from '@ngrx/store';

import * as TasksDetailsActions from './tasks-details.actions';
import { TasksDetailsEntity } from './tasks-details.models';
import { State, tasksDetailsInitialState, reducer } from './tasks-details.reducer';

describe('TasksDetails Reducer', () => {
  const createTasksDetailsEntity = (
    id: string,
    name = ''
  ): TasksDetailsEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid TasksDetails actions', () => {
    it('loadTasksDetailsSuccess should return the list of known TasksDetails', () => {
      const tasksDetails = [
        createTasksDetailsEntity('PRODUCT-AAA'),
        createTasksDetailsEntity('PRODUCT-zzz'),
      ];
      const action = TasksDetailsActions.loadTasksDetailsSuccess({
        tasksDetails,
      });

      const result: State = reducer(tasksDetailsInitialState, action);

      expect(result.loaded).toBe(true);
      expect(result.ids.length).toBe(2);
    });
  });

  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(tasksDetailsInitialState, action);

      expect(result).toBe(tasksDetailsInitialState);
    });
  });
});
