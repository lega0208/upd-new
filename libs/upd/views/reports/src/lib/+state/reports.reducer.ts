import { createReducer, on, Action } from '@ngrx/store';

import * as ReportsActions from './reports.actions';
import { ReportsData } from '@dua-upd/types-common';

export const REPORTS_FEATURE_KEY = 'reports';

export interface ReportsState {
  data: ReportsData;
  loaded: boolean; // has the Reports list been loaded
  error?: string | null; // last known error (if any)
}

export interface ReportsPartialState {
  readonly [REPORTS_FEATURE_KEY]: ReportsState;
}

export const reportsInitalState: ReportsState = {
  // set initial required properties
  data: {
    projects: [],
    tasks: [],
  },
  loaded: false,
  error: null,
};

const reducer = createReducer(
  reportsInitalState,
  on(
    ReportsActions.loadReportsInit,
    (state): ReportsState => ({
      ...state,
      loaded: false,
      error: null,
    })
  ),
  on(
    ReportsActions.loadReportsSuccess,
    (state, { data }): ReportsState => ({
      data: data,
      loaded: true,
      error: null,
    })
  ),
  on(
    ReportsActions.loadReportsFailure,
    (state, { error }): ReportsState => ({
      ...state,
      loaded: true,
      error,
    })
  )
);

export function reportsReducer(
  state: ReportsState | undefined,
  action: Action
) {
  return reducer(state, action);
}
