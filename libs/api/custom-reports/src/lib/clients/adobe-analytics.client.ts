import type {
  AAMaybeResponse,
  AAResponseBody,
  AdobeAnalyticsReportQuery,
  AnalyticsCoreAPI,
} from '@dua-upd/external-data';
import { getAAClient } from '@dua-upd/external-data';
import { days, withMutex } from '@dua-upd/utils-common';

class AAClient {
  private client: AnalyticsCoreAPI;
  private delay: Promise<void> = Promise.resolve();
  private tokenExpiry = 0;

  constructor(private keyPath?: string) {}

  async execute(query: AdobeAnalyticsReportQuery) {
    if (!this.client || this.tokenIsExpired()) {
      await this.initClient();
    }

    await this.delay;

    const resultsPromise: Promise<AAMaybeResponse> =
      this.client.getReport(query);

    this.resetDelay();

    return resultsPromise.then((results) => {
      if ('errorCode' in results.body) {
        throw new Error(`Error response received from AA API call:
      Error code ${results.body.errorCode}: ${results.body.errorDescription}`);
      }

      return results.body as AAResponseBody;
    });
  }

  async initClient(
    clientTokenExpiry = Math.floor((Date.now() + days(1)) / 1000),
  ) {
    this.tokenExpiry = clientTokenExpiry;

    this.client = await getAAClient(clientTokenExpiry, this.keyPath);

    return this.client;
  }

  private tokenIsExpired() {
    return this.tokenExpiry < Math.floor(Date.now() / 1000);
  }

  private resetDelay() {
    this.delay = new Promise((resolve) => setTimeout(resolve, 510));
  }
}

const createAAClient = (keyPath?: string) => withMutex(new AAClient(keyPath));

// use pool to invisibly intersperse requests between clients
// can make this generic to any client type and add settings like concurrency, rate limiting, etc.
export class AdobeAnalyticsClient {
  private clientPool: AAClient[] = [];

  constructor(keyPaths: AnalyticsCoreAPI[] = []) {
    if (keyPaths.length === 0) {
      this.clientPool = [createAAClient()];

      return;
    }

    this.clientPool = keyPaths.map((keyPath) => createAAClient(keyPath));
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
