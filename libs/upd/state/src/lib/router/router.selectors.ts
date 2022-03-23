import { Params } from '@angular/router';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RouterReducerState } from '@ngrx/router-store';

export const selectRouter = createFeatureSelector<RouterReducerState>('router');

export const selectRouteNestedParams = createSelector(selectRouter, (router) => {
  let currentRoute = router?.state?.root;
  let params: Params = {};
  while (currentRoute?.firstChild) {
    currentRoute = currentRoute.firstChild;
    params = {
      ...params,
      ...currentRoute.params,
    };
  }
  return params;
});

export const selectRouteNestedParam = (param: string) =>
  createSelector(selectRouteNestedParams, (params) => params && params[param]);
