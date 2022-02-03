import dayjs from 'dayjs';
import {
  AnalyticsCoreAPI,
  getAAClient,
  AdobeAnalyticsClient,
  AdobeAnalyticsQueryBuilder,
  AdobeAnalyticsReportQuery,
  queryDateFormat,
  SEGMENTS,
  getArraySeperated,
  sortArrayDesc
} from './adobe-analytics';

import {
  getGscClient,
  Searchconsole,
  SearchAnalyticsClient,
} from './google-search-console';
import { AirtableClient, AirTableAPI } from './airtable';

import { withRateLimit } from './utils';
import { Overall } from '@cra-arc/db';

// need to set a bigger timout because AA is super slow :)
jest.setTimeout(30000);

describe('externalData', () => {
  let aaClient: AnalyticsCoreAPI;
  let query: AdobeAnalyticsReportQuery;

  it('should initialise the client and be able to query the API', async () => {
    aaClient = await getAAClient();
    expect(aaClient).toBeDefined();
  });

  it('should be able to get the segments', async () => {
    const segments = await aaClient.getMetrics(process.env.AW_REPORTSUITE_ID);

    expect(segments).toBeDefined();
  });

  it('should be able to initalize the query builder', async () => {
    const queryBuilder = new AdobeAnalyticsQueryBuilder(process.env.AW_REPORTSUITE_ID);
    expect(queryBuilder).toBeDefined();
  });

  it('should be able to build a query', async () => {
    const queryBuilder = new AdobeAnalyticsQueryBuilder(process.env.AW_REPORTSUITE_ID);
    query = queryBuilder
      .addMetric('metrics/visits', '1')
      .setDimension('variables/evar12')
      .setGlobalFilters([
        {
          type: 'dateRange',
          dateRange: `${dayjs()
            .subtract(3, 'day')
            .toISOString()
            .replace(/.$/, '')}/${dayjs()
            .subtract(2, 'day')
            .toISOString()
            .replace(/.$/, '')}`
        },
        {
          type: 'segment',
          segmentId: SEGMENTS.cra,
        },
      ])
      .setSearch({
        clause: '( CONTAINS \'www.canada.ca/en/revenue-agency/services/e-services/cra-login-services.html\' )'
        + ' OR ( CONTAINS \'www.canada.ca/en/revenue-agency/services/e-services/represent-a-client.html\' )'
      })
      .setSettings({ limit: 500 })
      .build();

    console.log(query);
    expect(query).toBeDefined();
  });

  it('should be able to get a report', async () => {
    const report = (await aaClient.getReport(query)).body;

    console.log(report);

    expect(report).toBeDefined();
  });
  it('should be able to get overall metrics', async () => {
    const client = new AdobeAnalyticsClient()

    const results = await client.getOverallMetrics({ start: dayjs('2022-01-16').format(queryDateFormat), end: dayjs('2022-01-17').format(queryDateFormat) });

    console.log(results);

    expect(results).toBeDefined();
  });

  it('should be able to get phrases for several pages', async () => {
    const client = new AdobeAnalyticsClient();

    const results = await client.getPageMetrics({
      start: dayjs('2022-01-16').format(queryDateFormat),
      end: dayjs('2022-01-17').format(queryDateFormat),
    });

    console.log(results);

    expect(results).toBeDefined();
  });
});

describe('Google Search Console', () => {
  let gscClient: Searchconsole;

  it('should initialise the client', () => {
    gscClient = getGscClient();
    expect(gscClient).toBeDefined();
  });

  it('should be able to get results for a basic query', async () => {
    const results = await gscClient.searchanalytics.query({
      siteUrl: 'https://www.canada.ca/',
      requestBody: {
        dimensions: ['date', 'query'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'equals',
                expression: 'https://www.canada.ca/en/services/taxes.html',
              },
            ],
          },
        ],
        startDate: '2022-01-01',
        endDate: '2022-01-02',
      },
    });

    console.log(results.data.rows);

    expect(results.data.rows).toBeDefined();
  });

  it('should be able to get results for GSC overall metrics for all CRA-related pages', async () => {
    const client = new SearchAnalyticsClient();
    const results = await client.getOverallMetrics({
      start: '2022-01-16',
      end: '2022-01-16',
    });

    console.log(results);
    expect(results).toBeDefined();
  });

  it('should be able to get results for GSC search terms for all CRA-related pages', async () => {
    const client = new SearchAnalyticsClient();
    const results = await client.getPageMetrics({
      start: '2022-01-16',
      end: '2022-01-16',
    });

    console.log(results);
    expect(results).toBeDefined();
  });

  it('should be able to get results for fresh data', async () => {
    const results = await gscClient.searchanalytics.query({
      siteUrl: 'https://www.canada.ca/',
      requestBody: {
        dimensions: ['date', 'query'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'equals',
                expression: 'https://www.canada.ca/en/services/taxes.html',
              },
            ],
          },
        ],
        startDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        dataState: 'all',
      },
    });
    console.log(results.data.rows);

    expect(results.data.rows).toBeDefined();
  });

  it('should be able to get results for a regex', async () => {
    const results = await gscClient.searchanalytics.query({
      siteUrl: 'https://www.canada.ca/',
      requestBody: {
        dimensions: ['date', 'query', 'page'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'includingRegex',
                expression:
                  '/en/revenue-agency|/fr/agence-revenu|/en/services/taxes|/fr/services/impots',
              },
            ],
          },
        ],
        startDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        dataState: 'all',
      },
    });

    console.log(results.data.rows);

    expect(results.data.rows).toBeDefined();
  });
});

describe('AirTable', () => {
  let atClient: AirTableAPI;

  it('should initialise the client', async () => {
    const client = new AirtableClient();
    const results = await client.getTasks();

    console.log(results);
  });

  it('should find a task', async () => {
    const client = new AirtableClient();
    const results = await client.findTask('recIDdp2y3RQkzqy7');

    console.log(results);
  });

  it('should grab all data from the start/end dates and call drivers bases/tables, and parse them into 1 array', async () => {
    const client = new AirtableClient();
    const results = await client.getCallDriver({
      start: '2021-11-30',
      end: '2021-12-01',
    });

    console.log(results);
    console.log(results.length);
  });
});

describe.skip('rate-limiting', () => {
  it('should rate-limit the function', async () => {
    const addAsync = async (a: number, b: number) => a + b;
    const rateLimitedAdd = withRateLimit<number, Parameters<typeof addAsync>>(
      addAsync,
      2
    );

    const numbersToAdd = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = await Promise.all(
      numbersToAdd.map((number) => rateLimitedAdd(number, 2))
    );

    expect(results).toBeDefined();
  });
});
