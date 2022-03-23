import { PagesHomeEntity } from './pages-home.models';
import {
  pagesHomeAdapter,
  PagesHomePartialState,
  pagesHomeInitialState,
} from './pages-home.reducer';
import * as PagesHomeSelectors from './pages-home.selectors';

describe('PagesHome Selectors', () => {
  const ERROR_MSG = 'No Error Available';
  const getPagesHomeId = (it: PagesHomeEntity) => it.id;
  const createPagesHomeEntity = (id: string, name = '') =>
    ({
      id,
      name: name || `name-${id}`,
    } as PagesHomeEntity);

  let state: PagesHomePartialState;

  beforeEach(() => {
    state = {
      pagesHome: pagesHomeAdapter.setAll(
        [
          createPagesHomeEntity('PRODUCT-AAA'),
          createPagesHomeEntity('PRODUCT-BBB'),
          createPagesHomeEntity('PRODUCT-CCC'),
        ],
        {
          ...pagesHomeInitialState,
          selectedId: 'PRODUCT-BBB',
          error: ERROR_MSG,
          loaded: true,
        }
      ),
    };
  });

  describe('PagesHome Selectors', () => {
    it('getAllPagesHome() should return the list of PagesHome', () => {
      const results = PagesHomeSelectors.getAllPagesHome(state);
      const selId = getPagesHomeId(results[1]);

      expect(results.length).toBe(3);
      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getSelected() should return the selected Entity', () => {
      const result = PagesHomeSelectors.getSelected(state) as PagesHomeEntity;
      const selId = getPagesHomeId(result);

      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getPagesHomeLoaded() should return the current "loaded" status', () => {
      const result = PagesHomeSelectors.getPagesHomeLoaded(state);

      expect(result).toBe(true);
    });

    it('getPagesHomeError() should return the current "error" state', () => {
      const result = PagesHomeSelectors.getPagesHomeError(state);

      expect(result).toBe(ERROR_MSG);
    });
  });
});
