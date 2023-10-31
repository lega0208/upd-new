// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import type { RouterReducerState } from '@ngrx/router-store';
import type { ActionReducer } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { localStorageSync } from 'ngrx-store-localstorage';
import { stateSanitizer, actionSanitizer } from '@dua-upd/upd/state';
import type { DateSelectionState, I18nState } from '@dua-upd/upd/state';

interface RootState {
  dateSelection: DateSelectionState;
  router: RouterReducerState;
  i18n: I18nState;
}

const localStorageSyncReducer = (
  reducer: ActionReducer<RootState>,
): ActionReducer<RootState> =>
  localStorageSync({
    keys: ['dateSelection', 'router', 'i18n'],
    rehydrate: true,
  })(reducer);

export const environment = {
  production: false,
  envImports: [
    StoreDevtoolsModule.instrument({
      actionSanitizer,
      stateSanitizer,
    }),
  ],
  metaReducers: [localStorageSyncReducer],
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
