import { PagesDetailsEntity } from './pages-details.models';
import {
  pagesDetailsAdapter,
  PagesDetailsPartialState,
  pagesDetailsInitialState,
} from './pages-details.reducer';
import * as PagesDetailsSelectors from './pages-details.selectors';

describe('PagesDetails Selectors', () => {
  const ERROR_MSG = 'No Error Available';
  const getPagesDetailsId = (it: PagesDetailsEntity) => it.id;
  const createPagesDetailsEntity = (id: string, name = '') =>
    ({
      id,
      name: name || `name-${id}`,
    } as PagesDetailsEntity);

  let state: PagesDetailsPartialState;

  beforeEach(() => {
    state = {
      pagesDetails: pagesDetailsAdapter.setAll(
        [
          createPagesDetailsEntity('PRODUCT-AAA'),
          createPagesDetailsEntity('PRODUCT-BBB'),
          createPagesDetailsEntity('PRODUCT-CCC'),
        ],
        {
          ...pagesDetailsInitialState,
          selectedId: 'PRODUCT-BBB',
          error: ERROR_MSG,
          loaded: true,
        }
      ),
    };
  });

  describe('PagesDetails Selectors', () => {
    it('getAllPagesDetails() should return the list of PagesDetails', () => {
      const results = PagesDetailsSelectors.getAllPagesDetails(state);
      const selId = getPagesDetailsId(results[1]);

      expect(results.length).toBe(3);
      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getSelected() should return the selected Entity', () => {
      const result = PagesDetailsSelectors.getSelected(
        state
      ) as PagesDetailsEntity;
      const selId = getPagesDetailsId(result);

      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getPagesDetailsLoaded() should return the current "loaded" status', () => {
      const result = PagesDetailsSelectors.selectPagesDetailsLoaded(state);

      expect(result).toBe(true);
    });

    it('getPagesDetailsError() should return the current "error" state', () => {
      const result = PagesDetailsSelectors.selectPagesDetailsError(state);

      expect(result).toBe(ERROR_MSG);
    });
  });
});
