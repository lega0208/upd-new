import { createReducer, on, Action } from '@ngrx/store';

import { ProjectsHomeData } from '@cra-arc/types-common';
import * as ProjectsHomeActions from './projects-home.actions';

export const PROJECTS_HOME_FEATURE_KEY = 'projectsHome';

export interface ProjectsHomeState {
  data: ProjectsHomeData;
  loaded: boolean; // has the ProjectsHome list been loaded
  error?: string | null; // last known error (if any)
}

export interface ProjectsHomePartialState {
  readonly [PROJECTS_HOME_FEATURE_KEY]: ProjectsHomeState;
}

export const projectsHomeInitialState: ProjectsHomeState = {
  // set initial required properties
  data: {
    numInProgress: 0,
    numPlanning: 0,
    numCompletedLast6Months: 0,
    totalCompleted: 0,
    numDelayed: 0,
    completedCOPS: 0,
    projects: [],
  },
  loaded: false,
  error: null,
};

const reducer = createReducer(
  projectsHomeInitialState,
  on(ProjectsHomeActions.loadProjectsHomeInit, (state) => ({
    ...state,
    loaded: false,
    error: null,
  })),
  on(ProjectsHomeActions.loadProjectsHomeSuccess, (state, { data }) => ({
    data: data,
    loaded: true,
    error: null,
  })),
  on(ProjectsHomeActions.loadProjectsHomeError, (state, { error }) => ({
    ...state,
    loaded: true,
    error,
  }))
);

export function projectsHomeReducer(
  state: ProjectsHomeState | undefined,
  action: Action
) {
  return reducer(state, action);
}
