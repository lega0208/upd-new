import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map } from 'rxjs';

import * as ProjectsDetailsActions from './projects-details.actions';

@Injectable()
export class ProjectsDetailsEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsDetailsActions.loadProjectsDetailsInit),
      mergeMap(() =>
        this.http
          .get('/api/projectsDetails/getData', {
            responseType: 'json',
            observe: 'body',
          })
          .pipe(
            map((data) =>
              ProjectsDetailsActions.loadProjectsDetailsSuccess({ data })
            ),
            catchError(() => EMPTY)
          )
      )
    )
  );

  constructor(private readonly actions$: Actions, private http: HttpClient) {}
}
