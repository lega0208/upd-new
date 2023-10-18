import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nx/angular';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import * as I18nActions from './i18n.actions';
import { I18nEffects } from './i18n.effects';

describe('I18nEffects', () => {
  let actions: Observable<Action>;
  let effects: I18nEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NxModule.forRoot()],
      providers: [
        I18nEffects,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(I18nEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: I18nActions.init() });

      const expected = hot('-a-|', {
        a: I18nActions.loadI18nSuccess({ i18n: [] }),
      });

      expect(effects.init$).toBeObservable(expected);
    });
  });
});
