import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';

import * as ProjectsHomeActions from './projects-home.actions';
import { ProjectsHomeState } from './projects-home.reducer';
import * as ProjectsHomeSelectors from './projects-home.selectors';
import { combineLatest, map } from 'rxjs';

import dayjs from 'dayjs/esm';
import utc from 'dayjs/esm/plugin/utc';
import 'dayjs/esm/locale/en-ca';
import 'dayjs/esm/locale/fr-ca';

import { FR_CA, LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';

dayjs.extend(utc);

@Injectable()
export class ProjectsHomeFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  currentLang$ = this.i18n.currentLang$;

  loaded$ = this.store.pipe(
    select(ProjectsHomeSelectors.getProjectsHomeLoaded)
  );
  projectsHomeData$ = this.store.pipe(
    select(ProjectsHomeSelectors.getProjectsHomeData)
  );

  projectsHomeTableData$ = combineLatest([this.projectsHomeData$, this.currentLang$]).pipe(
    map(([data, lang]) => {
    const dateFormat = lang === FR_CA ? 'D MMM YYYY' : 'MMM DD, YYYY';
    const projectsHome = data?.projects?.map((d) => ({
      ...d,
      title: d.title ? this.i18n.service.translate(d.title.replace(/\s+/g, ' '), lang) : '',
      startDate: d.startDate ? dayjs
        .utc(d.startDate)
        .locale(lang)
        .format(dateFormat) : '',
    }));
    return [...(projectsHome || [])];
    //data?.taskSuccessByUxTest)
    })
  );

  numInProgress$ = this.projectsHomeData$.pipe(
    map((data) => data?.numInProgress)
  );
  numPlanning$ = this.projectsHomeData$.pipe(
    map((data) => data?.numPlanning)
  );
  numCompletedLast6Months$ = this.projectsHomeData$.pipe(
    map((data) => data?.numCompletedLast6Months)
  );
  totalCompleted$ = this.projectsHomeData$.pipe(
    map((data) => data?.totalCompleted)
  );
  numDelayed$ = this.projectsHomeData$.pipe(
    map((data) => data?.numDelayed)
  );
  error$ = this.store.pipe(select(ProjectsHomeSelectors.getProjectsHomeError));

  constructor(private readonly store: Store<ProjectsHomeState>, private i18n: I18nFacade) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(ProjectsHomeActions.loadProjectsHomeInit());
  }
}
