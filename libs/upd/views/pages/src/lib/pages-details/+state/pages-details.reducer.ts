import { createReducer, on, Action } from '@ngrx/store';

import * as PagesDetailsActions from './pages-details.actions';
import { PageDetailsData } from '@dua-upd/types-common';

export const PAGES_DETAILS_FEATURE_KEY = 'pagesDetails';

export interface PagesDetailsState {
  data: PageDetailsData;
  loaded: boolean; // has the PagesDetails list been loaded
  loading: boolean; // is the PagesDetails list currently being loaded
  error?: string | null; // last known error (if any)
}

export interface PagesDetailsPartialState {
  readonly [PAGES_DETAILS_FEATURE_KEY]: PagesDetailsState;
}

export const pagesDetailsInitialState: PagesDetailsState = {
  // set initial required properties
  data: {
    _id: '',
    url: '',
    title: '',
    dateRange: '',
    comparisonDateRange: '',
    feedbackComments: [],
    searchTerms: [],
    // readability: [],
  },
  loading: false,
  loaded: false,
  error: null,
};

const reducer = createReducer(
  pagesDetailsInitialState,
  on(PagesDetailsActions.loadPagesDetailsInit, (state) => ({
    ...state,
    loading: true,
    loaded: false,
    start: false,
    error: null,
  })),
  on(PagesDetailsActions.loadPagesDetailsSuccess, (state, { data }) =>
    data === null
      ? {
          ...state,
          loading: false,
          loaded: true,
          error: null,
        }
      : {
          ...state,
          data: { ...data },
          loading: false,
          loaded: true,
          error: null,
        }
  ),
  on(PagesDetailsActions.loadPagesDetailsError, (state, { error }) => ({
    ...state,
    loading: false,
    loaded: true,
    error,
  }))
);

export function pagesDetailsReducer(
  state: PagesDetailsState | undefined,
  action: Action
) {
  return reducer(state, action);
}
