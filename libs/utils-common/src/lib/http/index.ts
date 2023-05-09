import { LoggerService } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import cheerio from 'cheerio/lib/slim';
import { batchAwait, Retry, squishTrim } from '../utils-common';
import { RateLimitUtils } from './utils';
import { Observable } from 'rxjs';

export type HttpClientOptions = {
  rateLimitDelay?: number;
  batchSize?: number;
  logger?: LoggerService | Console;
  rateLimitStats?: boolean;
  rejectOn404?: boolean;
};

export type HttpClientResponse = {
  url: string;
  body?: string;
  is404: boolean;
  redirect?: string;
  response?: AxiosResponse;
  error?: Error;
};

export class HttpClient {
  private rateLimitDelay = 10;
  private delayContainer = { delay: this.rateLimitDelay };
  private readonly batchSize: number;
  private readonly logger: LoggerService | Console = console;
  private readonly rateLimitStats: boolean;
  private readonly rejectOn404: boolean;
  private rateLimitUtils = new RateLimitUtils();

  constructor(options: HttpClientOptions = {}) {
    this.rateLimitDelay = options.rateLimitDelay || this.rateLimitDelay;
    this.batchSize = options.batchSize || 100;
    this.logger = options.logger || this.logger;
    this.rateLimitStats = options.rateLimitStats || false;
    this.rejectOn404 = options.rejectOn404 || false;
  }

  private set delay(delay: number) {
    this.rateLimitDelay = delay;
    this.delayContainer.delay = delay;
  }

  @Retry(4, 500)
  async get(url: string): Promise<HttpClientResponse> {
    if (this.rateLimitStats) {
      this.rateLimitUtils.incrementRequests();
      this.rateLimitUtils.updateStats();
    }

    const rateLimitExceededRegex = /503/;
    const notFoundRegex = /404/;

    const protocolRegex = /^https?:\/\//;
    const requestUrl = protocolRegex.test(url) ? url : `https://${url}`;

    try {
      const response = await axios.get<string, AxiosResponse<string, string>>(
        requestUrl,
        {
          validateStatus: null,
          maxRedirects: 10,
        }
      );

      const responseUrl: string = (
        response.request._redirectable?._currentUrl ||
        response.headers['location']
      ).replace('https://', '');

      const is404 =
        response.status === 404 ||
        responseUrl === 'www.canada.ca/errors/404.html';

      const isRedirect = response.request._redirectable?._isRedirect && !is404;

      if (is404 && this.rejectOn404) {
        return Promise.reject(new Error(`404: ${url}`));
      }

      const redirect = isRedirect ? { redirect: responseUrl } : {};

      return {
        url,
        body: response.data,
        ...redirect,
        is404,
      };
    } catch (e) {
      this.logger.error(`Error fetching page data for ${url}:`);
      this.logger.error(e);

      if (e instanceof Error) {
        if (rateLimitExceededRegex.test(e.message)) {
          this.logger.warn('Rate limit exceeded. Request stats:');

          const utilsStats = this.rateLimitUtils.getStats();
          const otherStats = {
            delay: this.delayContainer.delay,
            batchSize: this.batchSize,
          };

          this.logger.warn(
            JSON.stringify({ ...utilsStats, ...otherStats }, null, 2)
          );

          this.logger.warn(
            `Resetting stats and increasing delay to ${
              this.delayContainer.delay + 10
            }ms...`
          );

          this.rateLimitUtils.reset();

          this.delay += 10;
        }

        if (notFoundRegex.test(e.message)) {
          if (this.rejectOn404) {
            throw e;
          }

          return {
            url,
            is404: true,
          };
        }
      }

      throw e;
    }
  }

  async getAll<T>(
    urls: string[],
    callback: (data: HttpClientResponse) => T = (data) => data as T
  ) {
    const batchFunc = async (url: string) => this.get(url).then(callback);

    return await batchAwait(
      urls,
      batchFunc,
      this.batchSize,
      this.delayContainer
    );
  }

  getAllObservable(urls: string[]) {
    return new Observable<HttpClientResponse>((subscriber) => {
      this.getAll(urls, (data) => subscriber.next(data))
        .then(() => subscriber.complete())
        .catch((err) => subscriber.error(err));
    });
  }
}
