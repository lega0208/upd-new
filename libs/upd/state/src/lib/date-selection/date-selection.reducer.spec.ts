import { Action } from '@ngrx/store';

import * as DateSelectionActions from './date-selection.actions';
import { DateSelectionEntity } from './date-selection.models';
import { State, initialState, reducer } from './date-selection.reducer';

describe('DateSelection Reducer', () => {
  const createDateSelectionEntity = (
    id: string,
    name = ''
  ): DateSelectionEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid DateSelection actions', () => {
    it('loadDateSelectionSuccess should return the list of known DateSelection', () => {
      const dateSelection = [
        createDateSelectionEntity('PRODUCT-AAA'),
        createDateSelectionEntity('PRODUCT-zzz'),
      ];
      const action = DateSelectionActions.loadDateSelectionSuccess({
        dateSelection,
      });

      const result: State = reducer(initialState, action);

      expect(result.loaded).toBe(true);
      expect(result.ids.length).toBe(2);
    });
  });

  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });
});
