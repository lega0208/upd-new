import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nrwl/angular';

import { createReducer, on, Action } from '@ngrx/store';

import * as OverviewActions from './overview.actions';
import { OverviewData } from '@dua-upd/types-common';
import { OverviewState, initialState, overviewReducer } from './overview.reducer';

import { Observable } from 'rxjs';

describe('Overview Reducer', () => {
  let actions: Observable<Action>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NxModule.forRoot()],
      providers: [
        overviewReducer,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });
//    effects = TestBed.inject(OverviewEffects);
  });

  it('should return the default state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action = {type: 'NOOP'} as any;

    const result = overviewReducer(undefined, action);
    expect(result).toBe(initialState);
  });

  it('init should return the loading state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action = {type: '[Overview Page] Init'} as any;

    const result = overviewReducer(undefined, action);
    expect(result.loading).toBe(true);
  });

  /**
  const createOverviewEntity = (id: string, name = ''): OverviewData => ({
    id,
    name: name || `name-${id}`,
  });

  describe('valid Overview actions', () => {
    it('loadOverviewSuccess should return the list of known Overview', () => {
      const overview = [
        createOverviewEntity('PRODUCT-AAA'),
        createOverviewEntity('PRODUCT-zzz'),
      ];
      const action = OverviewActions.loadOverviewSuccess({ overview });



      const result: OverviewState = overviewReducer(initialState, action);

      expect(result.loaded).toBe(true);
      expect(result.data.ids.length).toBe(2);
    });
  });

  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = overviewReducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

*/

});
