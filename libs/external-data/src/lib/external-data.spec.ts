import { writeFile } from 'fs/promises';
import dayjs from 'dayjs';
import { AirtableClient } from './airtable';
import {
  getGscClient,
  Searchconsole,
  SearchAnalyticsClient,
} from './google-search-console';

jest.setTimeout(250000);

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

    expect(results.data.rows).toBeDefined();
  });

  it('should be able to get results for GSC overall metrics for all CRA-related pages', async () => {
    const client = new SearchAnalyticsClient();
    const results = await client.getOverallMetrics({
      start: '2022-01-16',
      end: '2022-01-16',
    });

    expect(results).toBeDefined();
  });

  it('should be able to get results for GSC search terms for all CRA-related pages', async () => {
    const client = new SearchAnalyticsClient();
    const results = await client.getPageMetrics({
      start: '2022-01-16',
      end: '2022-01-16',
    });

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

    expect(results.data.rows).toBeDefined();
  });
});

describe('AirTable', () => {
  it('should initialise the client', async () => {
    const client = new AirtableClient();

    expect(client).toBeDefined();
  });

  it('should get a list of all published pages', async () => {
    const client = new AirtableClient();
    const results = await client
      .getPagesList()
      .then((results) =>
        writeFile('all_pages.json', JSON.stringify(results, null, 2)).then(
          () => results
        )
      );

    return expect(results).toBeDefined();
  });

  //
  // it('should find a task', async () => {
  //   const client = new AirtableClient();
  //   const results = await client.findTask('recIDdp2y3RQkzqy7');
  //
  //   console.log(results);
  // });
  //
  // it('should grab all data from the start/end dates and call drivers bases/tables, and parse them into 1 array', async () => {
  //   const client = new AirtableClient();
  //   const results = await client.getCallDriver({
  //     start: '2021-11-30',
  //     end: '2021-12-01',
  //   });
  //
  //   console.log(results);
  //   console.log(results.length);
  // });
});
