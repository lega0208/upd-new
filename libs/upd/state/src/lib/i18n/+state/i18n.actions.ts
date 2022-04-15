import { createAction, props } from '@ngrx/store';
import { LocaleId } from '@cra-arc/upd/i18n';

export const init = createAction('[I18n] Init');

export const setLang = createAction(
  '[I18n] Set Language',
  props<{ lang: LocaleId }>()
);
