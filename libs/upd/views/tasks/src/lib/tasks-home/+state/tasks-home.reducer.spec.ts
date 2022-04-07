import { Action } from '@ngrx/store';

import * as TasksHomeActions from './tasks-home.actions';
import { TasksHomeEntity } from './tasks-home.models';
import { State, tasksHomeInitialState, reducer } from './tasks-home.reducer';

describe('TasksHome Reducer', () => {
  const createTasksHomeEntity = (id: string, name = ''): TasksHomeEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid TasksHome actions', () => {
    it('loadTasksHomeSuccess should return the list of known TasksHome', () => {
      const tasksHome = [
        createTasksHomeEntity('PRODUCT-AAA'),
        createTasksHomeEntity('PRODUCT-zzz'),
      ];
      const action = TasksHomeActions.loadTasksHomeSuccess({ tasksHome });

      const result: State = reducer(tasksHomeInitialState, action);

      expect(result.loaded).toBe(true);
      expect(result.ids.length).toBe(2);
    });
  });

  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(tasksHomeInitialState, action);

      expect(result).toBe(tasksHomeInitialState);
    });
  });
});
