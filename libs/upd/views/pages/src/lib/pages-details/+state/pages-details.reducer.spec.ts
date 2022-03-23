import { Action } from '@ngrx/store';

import * as PagesDetailsActions from './pages-details.actions';
import { PagesDetailsEntity } from './pages-details.models';
import { State, pagesDetailsInitialState, reducer } from './pages-details.reducer';

describe('PagesDetails Reducer', () => {
  const createPagesDetailsEntity = (
    id: string,
    name = ''
  ): PagesDetailsEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid PagesDetails actions', () => {
    it('loadPagesDetailsSuccess should return the list of known PagesDetails', () => {
      const pagesDetails = [
        createPagesDetailsEntity('PRODUCT-AAA'),
        createPagesDetailsEntity('PRODUCT-zzz'),
      ];
      const action = PagesDetailsActions.loadPagesDetailsSuccess({
        pagesDetails,
      });

      const result: State = reducer(pagesDetailsInitialState, action);

      expect(result.loaded).toBe(true);
      expect(result.ids.length).toBe(2);
    });
  });

  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(pagesDetailsInitialState, action);

      expect(result).toBe(pagesDetailsInitialState);
    });
  });
});
