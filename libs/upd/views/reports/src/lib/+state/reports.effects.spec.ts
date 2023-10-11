import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import * as ReportsActions from './reports.actions';
import { ReportsEffects } from './reports.effects';

describe('ReportsEffects', () => {
  let actions: Observable<Action>;
  let effects: ReportsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ReportsEffects,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(ReportsEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: ReportsActions.initReports() });

      const expected = hot('-a-|', {
        a: ReportsActions.loadReportsSuccess({ data: [] }),
      });

      expect(effects.init$).toBeObservable(expected);
    });
  });
});
