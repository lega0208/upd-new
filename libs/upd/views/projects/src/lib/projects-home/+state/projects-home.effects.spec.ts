import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nrwl/angular';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import * as ProjectsHomeActions from './projects-home.actions';
import { ProjectsHomeEffects } from './projects-home.effects';

describe('ProjectsHomeEffects', () => {
  let actions: Observable<Action>;
  let effects: ProjectsHomeEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NxModule.forRoot()],
      providers: [
        ProjectsHomeEffects,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(ProjectsHomeEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: ProjectsHomeActions.loadProjectsHomeInit() });

      const expected = hot('-a-|', {
        a: ProjectsHomeActions.loadProjectsHomeSuccess({ projectsHome: [] }),
      });

      expect(effects.init$).toBeObservable(expected);
    });
  });
});
