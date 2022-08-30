import { Action } from '@ngrx/store';
import { PagesHomeData } from '@dua-upd/types-common';
import { PagesHomeState } from '@dua-upd/upd/views/pages';

interface PagesHomeAction extends Action {
  data: PagesHomeData;
}

export const actionSanitizer = (action: Action) =>
  action.type === '[PagesHome/API] Load PagesHome Success' &&
  (action as PagesHomeAction).data
    ? { ...action, data: '<<LONG_BLOB>>' }
    : action;

export const stateSanitizer = (state: { pagesHome: PagesHomeState }) =>
  state.pagesHome?.data
    ? {
      ...state,
      pagesHome: {
        ...state.pagesHome,
        data: '<<PAGES-HOME_DATA>>',
      },
    }
    : state
