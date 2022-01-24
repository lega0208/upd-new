import dayjs from 'dayjs';
import {
  AnalyticsCoreAPI,
  getAAClient,
  AdobeAnalyticsClient,
  AdobeAnalyticsQueryBuilder,
  AdobeAnalyticsReportQuery,
  queryDateFormat,
  SEGMENTS,
} from './adobe-analytics';

import { getGscClient, Searchconsole } from './google-search-console';

import { withRateLimit } from './utils';

// need to set a bigger timout because AA is super slow :)
jest.setTimeout(30000);

describe('new AA fields', () => {
  const client = new AdobeAnalyticsClient();

  it('should work', async () => {
    const dateRange = {
      start: dayjs('2022-01-01').format(queryDateFormat),
      end: dayjs('2022-01-02').format(queryDateFormat),
    };
    const results = await client.getOverallMetrics(dateRange);

    console.log(results);

    expect(results).toBeDefined();
  })
});

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

    const results = await client.getOverallMetrics({ start: '2022-01-16', end: '2022-01-17' });

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
            filters: [{
              dimension: 'page',
              operator: 'equals',
              expression: 'https://www.canada.ca/en/services/taxes.html',
            }]
          }
        ],
        startDate: '2022-01-01',
        endDate: '2022-01-02',
      }
    });

    console.log(results.data.rows);

    expect(results.data.rows).toBeDefined();
  })
})

describe.skip('rate-limiting', () => {
  it('should rate-limit the function', async () => {
    const addAsync = async (a: number, b: number) => a + b;
    const rateLimitedAdd = withRateLimit<number, Parameters<typeof addAsync>>(addAsync, 2);

    const numbersToAdd = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = await Promise.all(numbersToAdd.map((number) => rateLimitedAdd(number, 2)));

    expect(results).toBeDefined();
  })
});
