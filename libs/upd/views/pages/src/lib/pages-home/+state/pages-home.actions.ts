import { createAction, props } from '@ngrx/store';
import { PagesHomeData } from '@cra-arc/types-common';

export const loadPagesHomeInit = createAction('[PagesHome] Init');

export const loadPagesHomeSuccess = createAction(
  '[PagesHome/API] Load PagesHome Success',
  props<{ data: PagesHomeData[] }>()
);

export const loadPagesHomeError = createAction(
  '[PagesHome/API] Load PagesHome Error',
  props<{ error: string }>()
);
