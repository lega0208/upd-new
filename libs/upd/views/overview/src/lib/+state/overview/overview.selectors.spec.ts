import { OverviewData } from './overview.models';
import {
  overviewAdapter,
  OverviewPartialState,
  initialState,
} from './overview.reducer';
import * as OverviewSelectors from './overview.selectors';

describe('Overview Selectors', () => {
  const ERROR_MSG = 'No Error Available';
  const getOverviewId = (it: OverviewData) => it.id;
  const createOverviewEntity = (id: string, name = '') =>
    ({
      id,
      name: name || `name-${id}`,
    } as OverviewData);

  let state: OverviewPartialState;

  beforeEach(() => {
    state = {
      overview: overviewAdapter.setAll(
        [
          createOverviewEntity('PRODUCT-AAA'),
          createOverviewEntity('PRODUCT-BBB'),
          createOverviewEntity('PRODUCT-CCC'),
        ],
        {
          ...initialState,
          selectedId: 'PRODUCT-BBB',
          error: ERROR_MSG,
          loaded: true,
        }
      ),
    };
  });

  describe('Overview Selectors', () => {
    it('getAllOverview() should return the list of Overview', () => {
      const results = OverviewSelectors.selectOverviewData(state);
      const selId = getOverviewId(results[1]);

      expect(results.length).toBe(3);
      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getSelected() should return the selected Entity', () => {
      const result = OverviewSelectors.getSelected(state) as OverviewData;
      const selId = getOverviewId(result);

      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getOverviewLoaded() should return the current "loaded" status', () => {
      const result = OverviewSelectors.selectOverviewLoaded(state);

      expect(result).toBe(true);
    });

    it('getOverviewError() should return the current "error" state', () => {
      const result = OverviewSelectors.selectOverviewError(state);

      expect(result).toBe(ERROR_MSG);
    });
  });
});
