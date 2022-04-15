import { I18nEntity } from './i18n.models';
import { i18nAdapter, I18nPartialState, i18nInitialState } from './i18n.reducer';
import * as I18nSelectors from './i18n.selectors';

describe('I18n Selectors', () => {
  const ERROR_MSG = 'No Error Available';
  const getI18nId = (it: I18nEntity) => it.id;
  const createI18nEntity = (id: string, name = '') =>
    ({
      id,
      name: name || `name-${id}`,
    } as I18nEntity);

  let state: I18nPartialState;

  beforeEach(() => {
    state = {
      i18n: i18nAdapter.setAll(
        [
          createI18nEntity('PRODUCT-AAA'),
          createI18nEntity('PRODUCT-BBB'),
          createI18nEntity('PRODUCT-CCC'),
        ],
        {
          ...i18nInitialState,
          selectedId: 'PRODUCT-BBB',
          error: ERROR_MSG,
          loaded: true,
        }
      ),
    };
  });

  describe('I18n Selectors', () => {
    it('getAllI18n() should return the list of I18n', () => {
      const results = I18nSelectors.getAllI18n(state);
      const selId = getI18nId(results[1]);

      expect(results.length).toBe(3);
      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getSelected() should return the selected Entity', () => {
      const result = I18nSelectors.getSelected(state) as I18nEntity;
      const selId = getI18nId(result);

      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getI18nLoaded() should return the current "loaded" status', () => {
      const result = I18nSelectors.getI18nLoaded(state);

      expect(result).toBe(true);
    });

    it('getI18nError() should return the current "error" state', () => {
      const result = I18nSelectors.getI18nError(state);

      expect(result).toBe(ERROR_MSG);
    });
  });
});
