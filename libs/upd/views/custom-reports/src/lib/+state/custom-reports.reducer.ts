import {
  createActionGroup,
  createFeature,
  createReducer,
  emptyProps,
  on,
  props,
} from '@ngrx/store';

const actions = createActionGroup({
  source: 'customReports',
  events: {
    load: () => emptyProps(),
    loadSuccess: props<{ reports: any[] }>(),
    loadFailure: (payload: { error: any }) => ({ payload }),
  },
});

interface State {
  reportState: 'creating' | 'loading' | 'loaded' | 'error';
}

const initialState: State = {
  reportState: 'creating',
};

export const customReportsFeature = createFeature({
  name: 'customReports',
  reducer: createReducer(
    initialState,
    on(actions.load, (state): State => ({ ...state, reportState: 'loading' })),
    on(
      actions.loadSuccess,
      (state): State => ({ ...state, reportState: 'loaded' }),
    ),
    on(
      actions.loadFailure,
      (state): State => ({ ...state, reportState: 'error' }),
    ),
  ),
});
