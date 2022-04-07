import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { NxModule } from '@nrwl/angular';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';

import * as ProjectsDetailsActions from './projects-details.actions';
import { ProjectsDetailsEffects } from './projects-details.effects';

describe('ProjectsDetailsEffects', () => {
  let actions: Observable<Action>;
  let effects: ProjectsDetailsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NxModule.forRoot()],
      providers: [
        ProjectsDetailsEffects,
        provideMockActions(() => actions),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(ProjectsDetailsEffects);
  });

  describe('init$', () => {
    it('should work', () => {
      actions = hot('-a-|', { a: ProjectsDetailsActions.loadProjectsDetailsInit() });

      const expected = hot('-a-|', {
        a: ProjectsDetailsActions.loadProjectsDetailsSuccess({
          projectsDetails: [],
        }),
      });

      expect(effects.init$).toBeObservable(expected);
    });
  });
});
