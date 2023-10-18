import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nx/angular';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import * as PagesDetailsActions from './pages-details.actions';
import { PagesDetailsEffects } from './pages-details.effects';

describe('PagesDetailsEffects', () => {
  let actions: Observable<Action>;
  let effects: PagesDetailsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NxModule.forRoot()],
      providers: [
        PagesDetailsEffects,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(PagesDetailsEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: PagesDetailsActions.loadPagesDetailsInit() });

      const expected = hot('-a-|', {
        a: PagesDetailsActions.loadPagesDetailsSuccess({ pagesDetails: [] }),
      });

      expect(effects.init$).toBeObservable(expected);
    });
  });
});
