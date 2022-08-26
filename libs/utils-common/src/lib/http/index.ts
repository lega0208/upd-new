import cheerio from 'cheerio';
import axios from 'axios';
import { batchAwait, squishTrim } from '../utils-common';
import { LoggerService } from '@nestjs/common';

export type IfRedirect = (
  url: string,
  data: { responseUrl: string; html: string; }
) => void;

export type OnSuccess = (
  url: string,
  data: { responseUrl: string; html: string; isRedirect: boolean; }
) => void;

export type If404 = (url: string) => void;

export type RequestOptions = {
  ifRedirect?: IfRedirect;
  if404?: If404;
  onSuccess?: OnSuccess;
};

export type HttpClientOptions = {
  rateLimitDelay?: number;
  batchSize?: number;
  logger?: LoggerService | Console;
};

export class HttpClient {
  cheerio = cheerio;
  rateLimitDelay = 10;
  delayContainer = { delay: this.rateLimitDelay };
  batchSize = 100;
  logger: LoggerService | Console = console;

  constructor(options: HttpClientOptions = {}) {
    this.rateLimitDelay = options.rateLimitDelay || this.rateLimitDelay;
    this.batchSize = options.batchSize || this.batchSize;
    this.logger = options.logger || this.logger;
  }

  set delay(delay: number) {
    this.rateLimitDelay = delay;
    this.delayContainer.delay = delay;
  }

  async get(url: string, options: RequestOptions = {}) {
    const { ifRedirect, if404, onSuccess } = options;

    const rateLimitExceededRegex = /503/;
    const notFoundRegex = /404/;

    const protocolRegex = /^https?:\/\//;
    const requestUrl = protocolRegex.test(url) ? url : `https://${url}`;

    try {
      return axios.get<string>(requestUrl).then((response) => {
        const isRedirect = !!response.request._redirectable?._isRedirect;

        const responseUrl = (
          response.request._redirectable?._currentUrl ||
          response.headers['location']
        ).replace('https://', '');

        const is404 =
          response.status === 404 ||
          responseUrl === 'www.canada.ca/errors/404.html';

        if (is404) {
          if404?.(url);

          return;
        }

        isRedirect && ifRedirect?.(url, { responseUrl, html: response.data });

        onSuccess?.(url, { responseUrl, html: response.data, isRedirect });

        return response.data;
      });
    } catch (e) {
      this.logger.error(`Error fetching page data for ${url}:`);
      this.logger.error(e);

      if (e instanceof Error) {
        if (rateLimitExceededRegex.test(e.message)) {
          this.delay += 10;
        }

        if (notFoundRegex.test(e.message)) {
          if404?.(url);
        }

        return Promise.reject(e.message);
      }

      return Promise.reject(e);
    }
  }

  async getAll(urls: string[], options: RequestOptions = {}) {
    return await batchAwait(
      urls,
      async (url) => this.get(url, options),
      this.batchSize,
      this.delayContainer
    );
  }

  async getCurrentTitlesAndUrls(urls: string[]) {
    const titlesAndRedirects: {
      url: string;
      title: string;
      isRedirect: boolean;
      currentUrl: string;
    }[] = [];

    const getTitleAndRedirect: OnSuccess = async (url, data) => {
      const rawTitle = (/<title>[\s\S]+?<\/title>/.exec(data.html) || [
        '',
      ])[0].replace(/\s+(-|&nbsp;|&ndash;)\s+Canada\.ca/i, '');

      const title = squishTrim(cheerio.load(rawTitle)('title').text());

      const results = {
        url,
        title,
        isRedirect: data.isRedirect,
        currentUrl: data.responseUrl,
      };

      titlesAndRedirects.push(results);
    }

    await this.getAll(urls, {
      onSuccess: getTitleAndRedirect,
    });

    return titlesAndRedirects;
  }
}
