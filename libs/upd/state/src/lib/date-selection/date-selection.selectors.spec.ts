import { DateSelectionEntity } from './date-selection.models';
import {
  dateSelectionAdapter,
  DateSelectionPartialState,
  initialState,
} from './date-selection.reducer';
import * as DateSelectionSelectors from './date-selection.selectors';

describe('DateSelection Selectors', () => {
  const ERROR_MSG = 'No Error Available';
  const getDateSelectionId = (it: DateSelectionEntity) => it.id;
  const createDateSelectionEntity = (id: string, name = '') =>
    ({
      id,
      name: name || `name-${id}`,
    } as DateSelectionEntity);

  let state: DateSelectionPartialState;

  beforeEach(() => {
    state = {
      dateSelection: dateSelectionAdapter.setAll(
        [
          createDateSelectionEntity('PRODUCT-AAA'),
          createDateSelectionEntity('PRODUCT-BBB'),
          createDateSelectionEntity('PRODUCT-CCC'),
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

  describe('DateSelection Selectors', () => {
    it('getAllDateSelection() should return the list of DateSelection', () => {
      const results = DateSelectionSelectors.getAllDateSelection(state);
      const selId = getDateSelectionId(results[1]);

      expect(results.length).toBe(3);
      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getSelected() should return the selected Entity', () => {
      const result = DateSelectionSelectors.getSelected(
        state
      ) as DateSelectionEntity;
      const selId = getDateSelectionId(result);

      expect(selId).toBe('PRODUCT-BBB');
    });

    it('getDateSelectionLoaded() should return the current "loaded" status', () => {
      const result = DateSelectionSelectors.getDateSelectionLoaded(state);

      expect(result).toBe(true);
    });

    it('getDateSelectionError() should return the current "error" state', () => {
      const result = DateSelectionSelectors.getDateSelectionError(state);

      expect(result).toBe(ERROR_MSG);
    });
  });
});
