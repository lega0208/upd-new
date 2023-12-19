import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

export interface CustomReportState {
  z: string;
}

// @@ set up something basic for now -- to use for all subcomponents
// https://ngrx.io/guide/component-store/usage
// https://docs.nestjs.com/techniques/server-sent-events
// https://github.com/nestjs/nest/blob/master/sample/28-sse/src/index.html (SSE example)
// https://expressjs.com/en/resources/middleware/compression.html (compression? maybe needed?)
// https://dev.to/icolomina/subscribing-to-server-sent-events-with-angular-ee8 (SSE observable example)

@Injectable()
export class CustomReportStore extends ComponentStore<CustomReportState> {
  constructor() {
    super({ z: 'z' });
  }

  readonly z$ = this.select((s) => s.z);

  readonly setZ = this.updater((state, z: string): CustomReportState => ({ ...state, z }));

}
