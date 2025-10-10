import { createReducer, on, Action } from '@ngrx/store';

import * as PagesDetailsActions from './pages-details.actions';
import { PageDetailsData } from '@dua-upd/types-common';

export const PAGES_DETAILS_FEATURE_KEY = 'pagesDetails';

export interface PagesDetailsState {
  data: PageDetailsData;
  loaded: boolean; // has the PagesDetails list been loaded
  loading: boolean; // is the PagesDetails list currently being loaded
  error?: string | null; // last known error (if any)
  loadedHashes: boolean;
  loadingHashes: boolean;
  errorHashes?: string | null;
  accessibilityByUrl: Record<string, any>; // Store accessibility data per URL for caching
  loadedAccessibility: boolean;
  loadingAccessibility: boolean;
  errorAccessibility?: string | null;
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
    feedbackByDay: [],
    searchTerms: [],
    readability: [],
    activityMap: [],
    mostRelevantCommentsAndWords: {
      en: { comments: [], words: [] },
      fr: { comments: [], words: [] },
    },
    numComments: 0,
    numCommentsPercentChange: null,
    hashes: [],
    alternatePageId: '',
  },
  loading: false,
  loaded: false,
  error: null,
  loadingHashes: false,
  loadedHashes: false,
  errorHashes: null,
  accessibilityByUrl: {},
  loadedAccessibility: false,
  loadingAccessibility: false,
  errorAccessibility: null,
};

const reducer = createReducer(
  pagesDetailsInitialState,
  on(
    PagesDetailsActions.loadPagesDetailsInit,
    (state): PagesDetailsState => ({
      ...state,
      loading: true,
      loadingHashes: true,
      loaded: false,
      error: null,
    }),
  ),
  on(
    PagesDetailsActions.loadPagesDetailsSuccess,
    (state, { data }): PagesDetailsState => {
      // If data is null, page is cached - keep everything including accessibility
      if (data === null) {
        return {
          ...state,
          loading: false,
          loaded: true,
          error: null,
        };
      }

      return {
        ...state,
        data: { ...data },
        loading: false,
        loaded: true,
        error: null,
        // Keep accessibilityByUrl cache intact across page navigation
      };
    }
  ),
  on(
    PagesDetailsActions.loadPagesDetailsError,
    (state, { error }): PagesDetailsState => ({
      ...state,
      loading: false,
      loaded: true,
      error,
    }),
  ),
  on(
    PagesDetailsActions.getHashes,
    (state): PagesDetailsState => ({
      ...state,
      loadingHashes: true,
      loadedHashes: false,
      errorHashes: null,
    }),
  ),
  on(
    PagesDetailsActions.getHashesSuccess,
    (state, { data }): PagesDetailsState =>
      data === null
        ? {
            ...state,
            loadingHashes: false,
            loadedHashes: true,
            errorHashes: null,
          }
        : {
            ...state,
            data: {
              ...state.data,
              hashes: data,
            },
            loadingHashes: false,
            loadedHashes: true,
            errorHashes: null,
          },
  ),
  on(
    PagesDetailsActions.getHashesError,
    (state, { error }): PagesDetailsState => ({
      ...state,
      loadingHashes: false,
      loadedHashes: true,
      errorHashes: error,
    }),
  ),
  on(
    PagesDetailsActions.loadAccessibilityInit,
    (state): PagesDetailsState => ({
      ...state,
      loadingAccessibility: true,
      loadedAccessibility: false,
      errorAccessibility: null,
    }),
  ),
  on(
    PagesDetailsActions.loadAccessibilitySuccess,
    (state, { url, data }): PagesDetailsState => ({
      ...state,
      accessibilityByUrl: {
        ...state.accessibilityByUrl,
        [url]: data, // Store data by URL for caching
      },
      loadingAccessibility: false,
      loadedAccessibility: true,
      errorAccessibility: null,
    }),
  ),
  on(
    PagesDetailsActions.loadAccessibilityError,
    (state, { error }): PagesDetailsState => ({
      ...state,
      loadingAccessibility: false,
      loadedAccessibility: true,
      errorAccessibility: error,
    }),
  ),
);

export function pagesDetailsReducer(
  state: PagesDetailsState | undefined,
  action: Action,
) {
  return reducer(state, action);
}
