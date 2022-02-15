import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { getGscClient, Searchconsole } from './client';
import { SearchAnalyticsQueryBuilder, SearchFilter } from './query';
import { DataState, Dimension } from './gsc-property';
import { GscSearchTermMetrics, Overall, PageMetrics } from '@cra-arc/db';
import { wait } from '@cra-arc/utils-common';
import { DateRange } from '../types';
import { datesFromDateRange } from '../utils';

export * from './client';
export * from './query';

dayjs.extend(utc);

export const craFilter: SearchFilter = {
  dimension: 'page',
  operator: 'includingRegex',
  expression:
    '/en/revenue-agency|/fr/agence-revenu|/en/services/taxes|/fr/services/impots',
};

export interface SearchAnalyticsQueryOptions {
  dataState?: DataState;
  rowLimit?: number;
}

export interface SearchAnalyticsPageQueryOptions
  extends SearchAnalyticsQueryOptions {
  url?: string;
}

export class SearchAnalyticsClient {
  private client: Searchconsole = getGscClient();

  async query(query) {
    return this.client.searchanalytics.query(query);
  }

  async getOverallMetrics(dateRange: DateRange, dataState?: DataState) {
    const dates = datesFromDateRange(dateRange);
    const promises = [];

    for (const date of dates) {
      const mergedDateResults = Promise.all([
        this.getOverallTotals(date, { dataState }),
        this.getOverallSearchTerms(date, { rowLimit: 250, dataState }),
      ]).then(([totals, searchTerms]) => ({
        ...totals,
        ...searchTerms,
      }));

      await wait(500);

      promises.push(mergedDateResults);
    }

    return await Promise.all(promises);
  }

  async getOverallTotals(
    date: string,
    options?: SearchAnalyticsQueryOptions
  ): Promise<Partial<Overall>> {
    const queryBuilder = new SearchAnalyticsQueryBuilder();

    const query = queryBuilder
      .setStartDate(date)
      .setEndDate(date)
      .setFilters([craFilter])
      .setDataState(options?.dataState || 'final')
      .setRowLimit(options?.rowLimit || 1)
      .build();

    const results = await this.query(query);

    if (!results.data.rows || results.data.rows?.length === 0) {
      return {};
    }

    return results.data.rows.map(
      (row) =>
        ({
          date: dayjs(date).utc(true).toDate(),
          gsc_total_clicks: row.clicks,
          gsc_total_impressions: row.impressions,
          gsc_total_ctr: row.ctr,
          gsc_total_position: row.position,
        } as Partial<Overall>)
    )[0];
  }

  async getOverallSearchTerms(
    date: string,
    options?: SearchAnalyticsQueryOptions
  ): Promise<Partial<Overall>> {
    const queryBuilder = new SearchAnalyticsQueryBuilder();

    const query = queryBuilder
      .setStartDate(date)
      .setEndDate(date)
      .addDimensions(['query'])
      .setFilters([craFilter])
      .setDataState(options?.dataState || 'final')
      .setRowLimit(options?.rowLimit || 250)
      .build();

    const results = await this.query(query);

    if (!results.data.rows || results.data.rows?.length === 0) {
      return {};
    }

    const gsc_searchterms: GscSearchTermMetrics[] = results.data.rows.map(
      (row) => ({
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        term: row.keys[0],
      })
    );

    return {
      date: dayjs(date).utc(true).toDate(),
      gsc_searchterms,
    };
  }

  async getPageMetrics(
    dateRange: DateRange,
    options?: SearchAnalyticsPageQueryOptions
  ) {
    const dates = datesFromDateRange(dateRange);
    const promises = [];

    for (const date of dates) {
      const mergedDateResults = Promise.all([
        this.getPageTotals(date, options),
        this.getPageSearchTerms(date, options),
      ]).then(([totals, searchTerms]) => {
        const resultsWithTotals = Object.values(totals).map((total) => ({
          ...total,
          ...(searchTerms[total.url] || {}),
        }));

        const pagesWithTotals = Object.keys(totals);

        const pagesWithoutTotals = Object.keys(searchTerms).filter(
          (url) => !pagesWithTotals.includes(url)
        );

        // Some pages don't seem to have totals, so we'll just sum the search term metrics
        const resultsWithoutTotals = pagesWithoutTotals.map((url) => {
          const pageResults = searchTerms[url];

          const totals = pageResults.gsc_searchterms.reduce(
            (results, searchTerm) => {
              results.gsc_total_clicks += searchTerm.clicks;
              results.gsc_total_impressions += searchTerm.impressions;
              results.gsc_total_ctr += searchTerm.ctr;
              results.gsc_total_position += searchTerm.position;
              return results;
            },
            {
              gsc_total_clicks: 0,
              gsc_total_impressions: 0,
              gsc_total_ctr: 0,
              gsc_total_position: 0,
            }
          );

          return {
            ...pageResults,
            ...totals,
          };
        });

        return [...resultsWithTotals, ...resultsWithoutTotals];
      });

      await wait(500);

      promises.push(mergedDateResults);
    }

    return await Promise.all(promises);
  }

  async getPageTotals(
    date: string,
    options?: SearchAnalyticsPageQueryOptions
  ): Promise<Record<string, Partial<PageMetrics>>> {
    const queryBuilder = new SearchAnalyticsQueryBuilder();

    const pageFilter: SearchFilter = !options?.url
      ? craFilter
      : {
          dimension: 'page',
          expression: `https://${options.url}`,
        };

    const dimensions: Dimension[] = ['page'];

    const pageMetricsQuery = queryBuilder
      .setStartDate(date)
      .setEndDate(date)
      .addDimensions(dimensions)
      .setFilters([pageFilter]) // split into en/fr, experiment with regex to find ways to optimize
      .setDataState(options?.dataState || 'final')
      .setRowLimit(options?.rowLimit || 25000)
      .build();

    const results = await this.query(pageMetricsQuery);

    if (!results.data.rows || results.data.rows?.length === 0) {
      return {};
    }

    return results.data.rows
      .map(
        (row) =>
          ({
            date: dayjs(date).utc(true).toDate(),
            url: row['keys'][0].replace('https://', '').replace('#.+', ''),
            gsc_total_clicks: row.clicks,
            gsc_total_impressions: row.impressions,
            gsc_total_ctr: row.ctr,
            gsc_total_position: row.position,
          } as Partial<PageMetrics>)
      )
      .reduce((results, pageMetrics) => {
        results[pageMetrics.url] = pageMetrics;

        return results;
      }, {} as Record<string, Partial<PageMetrics>>);
  }

  async getPageSearchTerms(
    date: string,
    options?: SearchAnalyticsPageQueryOptions
  ): Promise<Record<string, Partial<PageMetrics>>> {
    const queryBuilder = new SearchAnalyticsQueryBuilder();

    const pageFilter: SearchFilter = !options?.url
      ? craFilter
      : {
          dimension: 'page',
          expression: `https://${options.url}`,
        };

    const dimensions: Dimension[] = ['page', 'query'];

    const query = queryBuilder
      .setStartDate(date)
      .setEndDate(date)
      .addDimensions(dimensions)
      .setFilters([pageFilter])
      .setDataState(options?.dataState || 'final')
      .setRowLimit(options?.rowLimit || 25000)
      .build();

    const results = await this.query(query);

    if (!results.data.rows || results.data.rows?.length === 0) {
      return {};
    }

    return results.data.rows.reduce((results, row) => {
      const url = row.keys[0].replace('https://', '').replace('#.+', '');

      if (!results[url]) {
        results[url] = {
          date: dayjs(date).utc(true).toDate(),
          url,
          gsc_searchterms: [],
        };
      }

      if (results[url].gsc_searchterms.length >= 250) {
        return results;
      }

      results[url].gsc_searchterms.push({
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        term: row.keys[1],
      });

      return results;
    }, {} as Record<string, Partial<PageMetrics>>);
  }
}

