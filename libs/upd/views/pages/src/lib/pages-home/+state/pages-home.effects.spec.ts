import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nx/angular';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import * as PagesHomeActions from './pages-home.actions';
import { PagesHomeEffects } from './pages-home.effects';

describe('PagesHomeEffects', () => {
  let actions: Observable<Action>;
  let effects: PagesHomeEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NxModule.forRoot()],
      providers: [
        PagesHomeEffects,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(PagesHomeEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: PagesHomeActions.loadPagesHomeInit() });

      const expected = hot('-a-|', {
        a: PagesHomeActions.loadPagesHomeSuccess({ pagesHome: [] }),
      });

      expect(effects.init$).toBeObservable(expected);
    });
  });
});
