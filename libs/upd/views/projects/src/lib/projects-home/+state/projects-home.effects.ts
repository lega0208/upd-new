import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map } from 'rxjs';

import { ApiService } from '@dua-upd/upd/services';
import * as ProjectsHomeActions from './projects-home.actions';

@Injectable()
export class ProjectsHomeEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsHomeActions.loadProjectsHomeInit),
      mergeMap(() =>
        this.api.getProjectsHomeData().pipe(
          map((data) => ProjectsHomeActions.loadProjectsHomeSuccess({ data })),
          catchError(() => EMPTY)
        )
      )
    )
  );

  constructor(private readonly actions$: Actions, private api: ApiService) {}
}
