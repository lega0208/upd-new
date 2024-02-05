import * as wbl from '@angular-devkit/build-angular/src/tools/babel/webpack-loader.js';
import * as app from '@angular-devkit/build-angular/src/tools/babel/presets/application.js';

// eslint-disable-next-line @typescript-eslint/ban-types
let requiresLinking: Function;
/**
 * Workaround for compatibility with Angular 16.2+
 */
if (typeof (wbl as any)['requiresLinking'] !== 'undefined') {
  requiresLinking = (wbl as any).requiresLinking;
} else if (typeof (app as any)['requiresLinking'] !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-types
  requiresLinking = (app as any)['requiresLinking'] as Function;
}

export { requiresLinking };
