import { ReportsEntity } from './reports.models';
import {
  reportsAdapter,
  ReportsPartialState,
  initialReportsState,
} from './reports.reducer';
import * as ReportsSelectors from './reports.selectors';

describe('Reports Selectors', () => {
  const ERROR_MSG = 'No Error Available';
  const getReportsId = (it: ReportsEntity) => it.id;
  const createReportsEntity = (id: string, name = '') =>
    ({
      id,
      name: name || `name-${id}`,
    } as ReportsEntity);

  let state: ReportsPartialState;

  beforeEach(() => {
    state = {
      reports: reportsAdapter.setAll(
        [
          createReportsEntity('PRODUCT-AAA'),
          createReportsEntity('PRODUCT-BBB'),
          createReportsEntity('PRODUCT-CCC'),
        ],
        {
          ...initialReportsState,
          selectedId: 'PRODUCT-BBB',
          error: ERROR_MSG,
          loaded: true,
        }
      ),
    };
  });

  describe('Reports Selectors', () => {
    it('selectAllReports() should return the list of Reports', () => {
      const results = ReportsSelectors.selectAllReports(state);
      const selId = getReportsId(results[1]);

      expect(results.length).toBe(3);
      expect(selId).toBe('PRODUCT-BBB');
    });

    it('selectEntity() should return the selected Entity', () => {
      const result = ReportsSelectors.selectEntity(state) as ReportsEntity;
      const selId = getReportsId(result);

      expect(selId).toBe('PRODUCT-BBB');
    });

    it('selectReportsLoaded() should return the current "loaded" status', () => {
      const result = ReportsSelectors.selectReportsLoaded(state);

      expect(result).toBe(true);
    });

    it('selectReportsError() should return the current "error" state', () => {
      const result = ReportsSelectors.selectReportsError(state);

      expect(result).toBe(ERROR_MSG);
    });
  });
});
