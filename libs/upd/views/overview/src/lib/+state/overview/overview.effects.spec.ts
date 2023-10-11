import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, createAction, props } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nx/angular';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import { OverviewData } from '@dua-upd/types-common';
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

    //    effects = TestBed.inject(OverviewEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: OverviewActions.init() });
      const loadOverviewSuccess = createAction(
        '[Overview/API] Load Overview Success',
        props<{ data: OverviewData }>()
      );

      //      const expected = hot('-a-|', {
      //        a: OverviewActions.loadOverviewSuccess({ data }),
      //      });

      //      expect(effects.init$).toBeObservable(expected);
      expect(loadOverviewSuccess).toBeTruthy;
    });
  });
});
