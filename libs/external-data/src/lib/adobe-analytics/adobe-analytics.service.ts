import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  AAItemId,
  AASearchTermMetrics,
  Overall,
  PageMetrics,
} from '@dua-upd/db';
import chalk from 'chalk';
import { logJson, wait } from '@dua-upd/utils-common';
import { DateRange } from '../types';
import {
  AdobeAnalyticsClient,
  createBatchedInternalSearchQueries,
  createInternalSearchItemIdsQuery,
  createInternalSearchQuery,
  createOverallMetricsQuery,
  createPageMetricsQuery,
  PageMetricsQueryOptions,
  toQueryFormat,
} from './';

dayjs.extend(utc);

export type SearchTermResult = {
  date: string;
  term: string;
  clicks: number;
  position: number;
};

export type InternalSearchResult = {
  date?: Date;
  aa_searchterms: AASearchTermMetrics[];
  itemId?: string;
};

@Injectable()
export class AdobeAnalyticsService {
  constructor(
    private logger: ConsoleLogger,
    @Inject(AdobeAnalyticsClient.name)
    private readonly client: AdobeAnalyticsClient
  ) {}

  async getOverallMetrics(
    dateRange: DateRange,
    options?: {
      onComplete?: <U>(
        data: Overall[]
      ) => U extends Promise<unknown> ? U : Promise<U>;
      inclusiveDateRange?: boolean;
    }
  ) {
    const endDate = options?.inclusiveDateRange
      ? dayjs.utc(dateRange.end).add(1, 'day').format('YYYY-MM-DD')
      : dateRange.end;

    return await this.client.executeQuery<Overall>(
      createOverallMetricsQuery({
        start: toQueryFormat(dateRange.start),
        end: toQueryFormat(endDate),
      }),
      {
        hooks: {
          pre: (dateRange) =>
            this.logger.log(`Fetching overall metrics for ${dateRange}:`),
          post: options?.onComplete,
        },
      }
    );
  }

  async getPageMetrics(
    dateRange: DateRange,
    options?: {
      onComplete?: (results: Partial<PageMetrics>[]) => Promise<void>;
    } & PageMetricsQueryOptions
  ) {
    return await this.client.executeMultiDayQuery<PageMetrics>(
      {
        start: toQueryFormat(dateRange.start),
        end: toQueryFormat(dateRange.end),
      },
      (dateRange) =>
        createPageMetricsQuery(dateRange, {
          ...options,
        }),
      {
        pre: (dateRange) =>
          this.logger.log(`Fetching page metrics from AA for ${dateRange}:`),
        post: options?.onComplete,
      },
      true
    );
  }

  async getInternalSearchItemIds({ start, end }: DateRange) {
    const query = createInternalSearchItemIdsQuery(
      {
        start: toQueryFormat(start),
        end: toQueryFormat(end),
      },
      {
        limit: 50000,
      }
    );

    return await this.client.executeQuery<AAItemId>(query);
  }

  async getOverallSearchTerms(
    dateRange: DateRange,
    lang: 'en' | 'fr',
    options?: {
      onComplete?: (results: SearchTermResult[]) => Promise<void>;
    }
  ) {
    dateRange = {
      start: toQueryFormat(dateRange.start),
      end: toQueryFormat(dateRange.end),
    };

    return await this.client.executeMultiDayQuery<AASearchTermMetrics>(
      dateRange,
      (dateRange) =>
        createInternalSearchQuery(dateRange, [], {
          limit: 400,
          lang: lang as 'en' | 'fr',
          includeSearchInstances: true,
        }),
      {
        pre: (dateRange) =>
          this.logger.log(
            chalk.blueBright(`Getting overall search terms for ${dateRange}...`)
          ),
        post: options?.onComplete,
      },
      true
    );
  }

  async getPageSearchTerms(dateRange: DateRange, itemIdDocs: AAItemId[]) {
    const itemIds = itemIdDocs.map(({ itemId }) => itemId);

    const queries = createBatchedInternalSearchQueries(dateRange, itemIds);

    const queryPromises: Promise<InternalSearchResult[]>[] = [];

    for (const [i, query] of queries.entries()) {
      const promise = this.client.executeQueryWithRetry<InternalSearchResult>(
        query,
        {
          hooks: {
            pre: (date) =>
              this.logger.log(
                `Dispatching (query ${i + 1}) searchterms for ${date}`
              ),
          },
        }
      );

      queryPromises.push(
        promise.catch((err) => this.logger.error(chalk.red(err.stack)))
      );

      await wait(520);
    }

    return (await Promise.all(queryPromises)).flat();
  }
}
