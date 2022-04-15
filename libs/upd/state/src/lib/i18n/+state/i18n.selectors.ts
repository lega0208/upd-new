import { createFeatureSelector, createSelector } from '@ngrx/store';
import { I18N_FEATURE_KEY, I18nState } from './i18n.reducer';

// Lookup the 'I18n' feature state managed by NgRx
export const getI18nState = createFeatureSelector<I18nState>(I18N_FEATURE_KEY);

export const selectCurrentLang = createSelector(
  getI18nState,
  (state: I18nState) => state.currentLang
);

