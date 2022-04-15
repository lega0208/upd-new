import { createReducer, on, Action } from '@ngrx/store';

import * as I18nActions from './i18n.actions';
import { LocaleId } from '@cra-arc/upd/i18n';

export const I18N_FEATURE_KEY = 'i18n';

export interface I18nState {
  currentLang: LocaleId,
}

export interface I18nPartialState {
  readonly [I18N_FEATURE_KEY]: I18nState;
}

const getInitialLang = () => (/^fr/.test(navigator.language) ? 'fr-CA' : 'en-CA') as LocaleId;

export const i18nInitialState: I18nState = {
  currentLang: getInitialLang(),
};

const reducer = createReducer(
  i18nInitialState,
  on(I18nActions.setLang, (state, { lang }) => ({ currentLang: lang })),
);

export function i18nReducer(state: I18nState | undefined, action: Action) {
  return reducer(state, action);
}
