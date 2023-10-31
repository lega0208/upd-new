import { inject, Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map } from 'rxjs';
import { ApiService } from '@dua-upd/upd/services';
import * as ProjectsHomeActions from './projects-home.actions';

@Injectable()
export class ProjectsHomeEffects {
  private readonly actions$ = inject(Actions);
  private api = inject(ApiService);

  init$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectsHomeActions.loadProjectsHomeInit),
      mergeMap(() =>
        this.api.getProjectsHomeData().pipe(
          map((data) => ProjectsHomeActions.loadProjectsHomeSuccess({ data })),
          catchError(() => EMPTY),
        ),
      ),
    );
  });
}
