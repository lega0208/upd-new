import { Action } from '@ngrx/store';

import * as I18nActions from './i18n.actions';
import { I18nEntity } from './i18n.models';
import { State, i18nInitialState, reducer } from './i18n.reducer';

describe('I18n Reducer', () => {
  const createI18nEntity = (id: string, name = ''): I18nEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid I18n actions', () => {
    it('loadI18nSuccess should return the list of known I18n', () => {
      const i18n = [
        createI18nEntity('PRODUCT-AAA'),
        createI18nEntity('PRODUCT-zzz'),
      ];
      const action = I18nActions.loadI18nSuccess({ i18n });

      const result: State = reducer(i18nInitialState, action);

      expect(result.loaded).toBe(true);
      expect(result.ids.length).toBe(2);
    });
  });

  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(i18nInitialState, action);

      expect(result).toBe(i18nInitialState);
    });
  });
});
