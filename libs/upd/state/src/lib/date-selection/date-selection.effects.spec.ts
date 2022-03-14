import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nrwl/angular';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import * as DateSelectionActions from './date-selection.actions';
import { DateSelectionEffects } from './date-selection.effects';

describe('DateSelectionEffects', () => {
  let actions: Observable<Action>;
  let effects: DateSelectionEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NxModule.forRoot()],
      providers: [
        DateSelectionEffects,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(DateSelectionEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: DateSelectionActions.init() });

      const expected = hot('-a-|', {
        a: DateSelectionActions.loadDateSelectionSuccess({ dateSelection: [] }),
      });

      expect(effects.init$).toBeObservable(expected);
    });
  });
});
