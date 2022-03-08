import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nrwl/angular';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import * as OverviewActions from './overview.actions';
import { OverviewEffects } from './overview.effects';

describe('OverviewEffects', () => {
  let actions: Observable<Action>;
  let effects: OverviewEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NxModule.forRoot()],
      providers: [
        OverviewEffects,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(OverviewEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: OverviewActions.init() });

      const expected = hot('-a-|', {
        a: OverviewActions.loadOverviewSuccess({ overview: [] }),
      });

      expect(effects.init$).toBeObservable(expected);
    });
  });
});
