import { Action } from '@ngrx/store';

import * as ReportsActions from './reports.actions';
import { ReportsEntity } from './reports.models';
import {
  ReportsState,
  initialReportsState,
  reportsReducer,
} from './reports.reducer';

describe('Reports Reducer', () => {
  const createReportsEntity = (id: string, name = ''): ReportsEntity => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid Reports actions', () => {
    it('loadReportsSuccess should return the list of known Reports', () => {
      const reports = [
        createReportsEntity('PRODUCT-AAA'),
        createReportsEntity('PRODUCT-zzz'),
      ];
      const action = ReportsActions.loadReportsSuccess({ reports });

      const result: ReportsState = reportsReducer(initialReportsState, action);

      expect(result.loaded).toBe(true);
      expect(result.ids.length).toBe(2);
    });
  });

  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reportsReducer(initialReportsState, action);

      expect(result).toBe(initialReportsState);
    });
  });
});
