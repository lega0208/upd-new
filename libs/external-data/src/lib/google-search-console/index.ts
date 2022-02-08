import { getGscClient, Searchconsole } from './client';
import { SearchAnalyticsQueryBuilder, SearchFilter } from './query';

export * from './client';
export * from './query';

export class SearchAnalyticsClient {
  client: Searchconsole;
  queryBuilder = new SearchAnalyticsQueryBuilder();

  constructor() {
    this.client = getGscClient();
  }

  async getOverallMetrics(dateRange: { start: string; end: string }) {
    const overallMetricsQuery = this.queryBuilder
      .setStartDate(dateRange.start)
      .setEndDate(dateRange.end)
      .addDimensions('date')
      .setFilters([
        {
          dimension: 'page',
          operator: 'includingRegex',
          expression:
            '/en/revenue-agency|/fr/agence-revenu|/en/services/taxes|/fr/services/impots',
        },
      ])
      .setDataState('final')
      .build();

    const results = await this.client.searchanalytics.query({
      siteUrl: 'https://www.canada.ca/',
      requestBody: overallMetricsQuery,
    });

    return results.data.rows;
  }

  async getPageMetrics(
    dateRange: { start: string; end: string },
    url?: string
  ) {
    const pageFilter: SearchFilter = url
      ? {
          dimension: 'page',
          expression: `https://${url}`,
        }
      : {
          dimension: 'page',
          operator: 'includingRegex',
          expression:
            '/en/revenue-agency|/fr/agence-revenu|/en/services/taxes|/fr/services/impots',
        };

    const pageMetricsQuery = this.queryBuilder
      .setStartDate(dateRange.start)
      .setEndDate(dateRange.end)
      .addDimensions('query')
      .addDimensions('date')
      .addDimensions('page')
      .setFilters([pageFilter])
      .setDataState('final')
      .setRowLimit(20000)
      .build();

    console.log(pageMetricsQuery);

    const results = await this.client.searchanalytics.query({
      siteUrl: 'https://www.canada.ca/',
      requestBody: pageMetricsQuery,
    });

    return results.data.rows;
  }
}
