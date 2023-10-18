import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nx/angular';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import * as TasksDetailsActions from './tasks-details.actions';
import { TasksDetailsEffects } from './tasks-details.effects';

describe('TasksDetailsEffects', () => {
  let actions: Observable<Action>;
  let effects: TasksDetailsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NxModule.forRoot()],
      providers: [
        TasksDetailsEffects,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(TasksDetailsEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: TasksDetailsActions.loadTasksDetailsInit() });

      const expected = hot('-a-|', {
        a: TasksDetailsActions.loadTasksDetailsSuccess({ tasksDetails: [] }),
      });

      expect(effects.init$).toBeObservable(expected);
    });
  });
});
