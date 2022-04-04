import { createAction, props } from '@ngrx/store';
import { PageDetailsData } from '@cra-arc/types-common';

export const loadPagesDetailsInit = createAction('[PagesDetails] Load PagesDetails Init');

export const loadPagesDetailsSuccess = createAction(
  '[PagesDetails/API] Load PagesDetails Success',
  props<{ data: PageDetailsData | null }>()
);

export const loadPagesDetailsError = createAction(
  '[PagesDetails/API] Load PagesDetails Error',
  props<{ error: string }>()
);
