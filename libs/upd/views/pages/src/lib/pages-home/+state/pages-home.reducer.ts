import { createReducer, on, Action } from '@ngrx/store';

import * as PagesHomeActions from './pages-home.actions';
import { PagesHomeData } from '@cra-arc/types-common';

export const PAGES_HOME_FEATURE_KEY = 'pagesHome';

export interface PagesHomeState {
  data: PagesHomeData[];
  loaded: boolean; // has the PagesHome list been loaded
  error?: string | null; // last known error (if any)
}

export interface PagesHomePartialState {
  readonly [PAGES_HOME_FEATURE_KEY]: PagesHomeState;
}

export const pagesHomeInitialState: PagesHomeState = {
  // set initial required properties
  data: [],
  loaded: false,
  error: null,
};

const reducer = createReducer(
  pagesHomeInitialState,
  on(PagesHomeActions.loadPagesHomeInit, (state) => ({
    ...state,
    loaded: false,
    error: null,
  })),
  on(PagesHomeActions.loadPagesHomeSuccess, (state, { data }) => ({
    data: data,
    loaded: true,
    error: null,
  })),
  on(PagesHomeActions.loadPagesHomeError, (state, { error }) => ({
    ...state,
    loaded: true,
    error,
  }))
);

export function pagesHomeReducer(
  state: PagesHomeState | undefined,
  action: Action
) {
  return reducer(state, action);
}
