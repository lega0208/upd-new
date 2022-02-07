import { getGscClient, Searchconsole } from './client';
import { SearchAnalyticsQueryBuilder } from './query';

export * from './client';
export * from './query';

import { withTimeout } from '../utils';

export class SearchAnalyticsClient {
  client: Searchconsole;
  queryBuilder = new SearchAnalyticsQueryBuilder();

  async initClient() {
    this.client = await getGscClient();
  }

  async getOverallMetrics(dateRange: { start: string; end: string }) {
    // todo: better way to handle dates / allow single dates
    if (!this.client) {
      await this.initClient();
    }

    const formattedDate = `${dateRange.start}/${dateRange.end}`;
    console.log(formattedDate);

    const overallMetricsQuery = this.queryBuilder
      .setStartDate(dateRange.start)
      .setEndDate(dateRange.end)
      .addDimensions('date')
      .setFilter([
        {
          dimension: 'page',
          operator: 'includingRegex',
          expression:
            '/en/revenue-agency|/fr/agence-revenu|/en/services/taxes|/fr/services/impots',
        },
      ])
      .setDataState('final')
      .build();

    console.log(overallMetricsQuery);

    // todo: figure out better way to handle timeouts, retries, etc
    const results = await withTimeout<any>(
      () =>
        this.client.searchanalytics.query({
          siteUrl: 'https://www.canada.ca/',
          requestBody: overallMetricsQuery,
        }),
      25000
    )();

    return results.data.rows;
  }

  async getPageMetrics(dateRange: { start: string; end: string }) {
    // todo: better way to handle dates / allow single dates
    if (!this.client) {
      await this.initClient();
    }

    const formattedDate = `${dateRange.start}/${dateRange.end}`;
    console.log(formattedDate);

    const pageMetricsQuery = this.queryBuilder
      .setStartDate(dateRange.start)
      .setEndDate(dateRange.end)
      .addDimensions('query')
      .addDimensions('date')
      .addDimensions('page')
      .setFilter([
        {
          dimension: 'page',
          operator: 'includingRegex',
          expression:
            '/en/revenue-agency|/fr/agence-revenu|/en/services/taxes|/fr/services/impots',
        },
      ])
      .setDataState('final')
      .setRowLimit(20000)
      .build();

    console.log(pageMetricsQuery);

    // todo: figure out better way to handle timeouts, retries, etc
    const results = await withTimeout<any>(
      () =>
        this.client.searchanalytics.query({
          siteUrl: 'https://www.canada.ca/',
          requestBody: pageMetricsQuery,
        }),
      25000
    )();

    return results.data.rows;
  }
}
