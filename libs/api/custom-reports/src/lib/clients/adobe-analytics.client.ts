import type { AnalyticsCoreAPI } from '@adobe/aio-lib-analytics';
import { days, withMutex, withRetry } from '@dua-upd/utils-common';
import type {
  AuthParams,
  AAMaybeResponse,
  AAResponseBody,
  AdobeAnalyticsReportQuery,
} from '@dua-upd/node-utils';
import {
  defaultAuthParams,
  getAAClient,
} from '@dua-upd/node-utils';

class AAClient {
  private client!: AnalyticsCoreAPI;
  private authParams!: AuthParams;
  private tokenExpiry = 0;

  constructor(authParams?: AuthParams) {
    if (authParams) {
      this.authParams = authParams;
    }
  }

  async execute(query: AdobeAnalyticsReportQuery) {
    await this.ensureClient();

    const resultsPromise: Promise<AAMaybeResponse> =
      this.client.getReport(query);

    return resultsPromise.then((results) => {
      if ('errorCode' in results.body) {
        throw new Error(
          `Error response received from AA API call:
          Error code ${results.body.errorCode}: ${results.body.errorDescription}`,
        );
      }

      return results.body as AAResponseBody;
    });
  }

  async initClient(authParams?: AuthParams) {
    this.authParams = authParams || this.authParams || defaultAuthParams();

    if (!this.authParams.expiryDateTime) {
      this.authParams.expiryDateTime = Math.floor(
        (Date.now() + days(1)) / 1000,
      );

      this.tokenExpiry = this.authParams.expiryDateTime;
    }

    const getAAClientWithRetry = withRetry(getAAClient, 3, 1000);

    this.client = await getAAClientWithRetry(this.authParams);

    return this.client;
  }

  private async ensureClient() {
    if (!this.client || this.tokenIsExpired()) {
      await this.initClient(
        this.authParams && {
          ...this.authParams,
          expiryDateTime: undefined,
        },
      );
    }
  }

  private tokenIsExpired() {
    return this.tokenExpiry < Math.floor(Date.now() / 1000);
  }
}

const createAAClient = (authParams?: AuthParams) =>
  withMutex(new AAClient(authParams), { unlockDelay: 510 });

// use pool to invisibly intersperse requests between clients
// can make this generic to any client type and add settings like concurrency, rate limiting, etc.
export class AdobeAnalyticsClient {
  private clientPool: AAClient[] = [];

  constructor(authParams: AuthParams[] = []) {
    if (authParams.length === 0) {
      this.clientPool = [createAAClient()];

      return;
    }

    this.clientPool = authParams.map((params) => createAAClient(params));
  }

  async init() {
    await Promise.all(this.clientPool.map((client) => client.initClient()));
  }

  async execute(query: AdobeAnalyticsReportQuery) {
    const client = this.clientPool.shift();

    if (!client) {
      throw new Error('No clients available');
    }

    const results = client.execute(query);

    this.clientPool.push(client);

    return results;
  }
}
