import { Action } from '@ngrx/store';

import * as OverviewActions from './overview.actions';
import { OverviewData } from './overview.models';
import { OverviewState, initialState, reducer } from './overview.reducer';

describe('Overview Reducer', () => {
  const createOverviewEntity = (id: string, name = ''): OverviewData => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid Overview actions', () => {
    it('loadOverviewSuccess should return the list of known Overview', () => {
      const overview = [
        createOverviewEntity('PRODUCT-AAA'),
        createOverviewEntity('PRODUCT-zzz'),
      ];
      const action = OverviewActions.loadOverviewSuccess({ overview });

      const result: OverviewState = reducer(initialState, action);

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
