import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nx/angular';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import * as TasksHomeActions from './tasks-home.actions';
import { TasksHomeEffects } from './tasks-home.effects';

describe('TasksHomeEffects', () => {
  let actions: Observable<Action>;
  let effects: TasksHomeEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NxModule.forRoot()],
      providers: [
        TasksHomeEffects,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(TasksHomeEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: TasksHomeActions.loadTasksHomeInit() });

      const expected = hot('-a-|', {
        a: TasksHomeActions.loadTasksHomeSuccess({ tasksHome: [] }),
      });

      expect(effects.init$).toBeObservable(expected);
    });
  });
});
