import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { catchError, EMPTY, mergeMap, map } from 'rxjs';

import * as ProjectsHomeActions from './projects-home.actions';

@Injectable()
export class ProjectsHomeEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsHomeActions.loadProjectsHomeInit),
      mergeMap(() =>
        this.http
          .get('/api/projectsHome/getData', {
            responseType: 'json',
            observe: 'body',
          })
          .pipe(
            map((data) =>
              ProjectsHomeActions.loadProjectsHomeSuccess({ data })
            ),
            catchError(() => EMPTY)
          )
      )
    )
  );

  constructor(private readonly actions$: Actions, private http: HttpClient) {}
}
