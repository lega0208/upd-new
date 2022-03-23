import { Action } from '@ngrx/store';

import * as PagesHomeActions from './pages-home.actions';
import { PagesHomeEntity } from './pages-home.models';
import { State, pagesHomeInitialState, reducer } from './pages-home.reducer';

describe('PagesHome Reducer', () => {
  const createPagesHomeEntity = (id: string, name = ''): PagesHomeEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid PagesHome actions', () => {
    it('loadPagesHomeSuccess should return the list of known PagesHome', () => {
      const pagesHome = [
        createPagesHomeEntity('PRODUCT-AAA'),
        createPagesHomeEntity('PRODUCT-zzz'),
      ];
      const action = PagesHomeActions.loadPagesHomeSuccess({ pagesHome });

      const result: State = reducer(pagesHomeInitialState, action);

      expect(result.loaded).toBe(true);
      expect(result.ids.length).toBe(2);
    });
  });

  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(pagesHomeInitialState, action);

      expect(result).toBe(pagesHomeInitialState);
    });
  });
});
