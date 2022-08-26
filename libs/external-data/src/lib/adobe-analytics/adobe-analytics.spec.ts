import { readFile } from 'fs/promises';
import dayjs from 'dayjs';
import { wait } from '@dua-upd/utils-common';
import { Overall, PageMetrics } from '@dua-upd/db';
import {
  AdobeAnalyticsClient,
  AdobeAnalyticsQueryBuilder,
  createActivityMapItemIdsQuery,
  createInternalSearchItemIdsQuery,
  createOverallMetricsQuery,
  createPageMetricsQuery,
  createPageUrlItemIdsQuery,
  ReportSearch,
  SEGMENTS,
  toQueryFormat,
} from './';
import { DateRange } from '../types';

// need to set a bigger timout because AA is super slow :)
jest.setTimeout(900000);

describe('AdobeAnalyticsClient', () => {
  let client: AdobeAnalyticsClient;

  beforeAll(async () => {
    client = new AdobeAnalyticsClient();
    return await client.initClient();
  });

  it('should refresh the JWT if expired, and be able to make a call with the refreshed token', async () => {
    const innerClient = await client.initClient(
      Math.floor(Date.now() / 1000) + 3
    );

    const initialToken = innerClient.token;

    // Token should be defined
    expect(initialToken).toBeDefined();

    await wait(3500);

    // After waiting 3.5s, token should be expired (to compensate for any overhead from the test)
    expect(client.clientTokenIsExpired()).toEqual(true);

    // Token should get refreshed and then able to successfully get data from the API

    const dateRange = {
      start: toQueryFormat('2022-06-10'),
      end: toQueryFormat('2022-06-11'),
    };

    const data = await client.getPageMetrics(dateRange, {
      settings: {
        limit: 10,
      },
      search: {
        clause: `BEGINS-WITH 'www.canada.ca' AND (BEGINS-WITH 'www.canada.ca/en/revenue-agency'\
        OR BEGINS-WITH 'www.canada.ca/fr/agence-revenu' OR BEGINS-WITH 'www.canada.ca/fr/services/impots'\
        OR BEGINS-WITH 'www.canada.ca/en/services/taxes')`,
      },
    });

    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const tokenAfterCall = client.client.token;

    expect(tokenAfterCall).not.toMatch(initialToken);
  });

  it('should be able to create queries with .createMultiDayQueries()', async () => {
    const dateRange = {
      start: toQueryFormat('2022-06-10'),
      end: toQueryFormat('2022-06-12'),
    };

    const queries = client.createMultiDayQueries(
      dateRange,
      (singleDateRange: DateRange) =>
        createPageMetricsQuery(singleDateRange, {
          search: {
            clause: `BEGINS-WITH 'www.canada.ca' AND (BEGINS-WITH 'www.canada.ca/en/revenue-agency'\
        OR BEGINS-WITH 'www.canada.ca/fr/agence-revenu' OR BEGINS-WITH 'www.canada.ca/fr/services/impots'\
        OR BEGINS-WITH 'www.canada.ca/en/services/taxes')`,
          },
        })
    );

    // "queries" should contain 2 queries: one for the 10th and one for the 11th

    // the "end date" is for 00:00:00 on that day, meaning it only
    //    includes data up to the end of the previous day

    const dateTimeFormat =
      /^\d{4}-\d{2}-\d{2}T00:00:00\.000\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/;

    expect(Array.isArray(queries)).toBe(true);
    expect(queries.length).toBe(2);
    expect(queries[0].search.clause).toMatch(/^BEGINS-WITH 'www\.canada\.ca'/);
    expect(queries[0].rsid).toBeDefined();
    expect(queries[0].dimension).toBeDefined();
    expect(queries[0].globalFilters[1].dateRange).toMatch(dateTimeFormat);
  });

  describe('executeQuery', () => {
    let mockPreHook: jest.Mock;
    let mockPostHook: jest.Mock;

    let dateRange: DateRange;
    let overallMetrics: Partial<PageMetrics>[];

    beforeAll(async () => {
      mockPreHook = jest.fn();
      mockPostHook = jest.fn();

      dateRange = {
        start: toQueryFormat('2022-06-10'),
        end: toQueryFormat('2022-06-12'),
      };

      overallMetrics = await client.executeQuery<Partial<Overall>>(
        createOverallMetricsQuery(dateRange),
        {
          hooks: {
            pre: mockPreHook,
            post: mockPostHook,
          },
        }
      );

      return overallMetrics;
    });

    it('should return overall metrics results', () => {
      console.log(overallMetrics);

      expect(Array.isArray(overallMetrics)).toBe(true);
      expect(overallMetrics.length).toBe(2);
    });

    it('should call pre and post hooks for each query', async () => {
      expect(mockPreHook).toHaveBeenCalledTimes(1);
      expect(mockPostHook).toHaveBeenCalledTimes(1);
    });

    it('should have the same results as getOverallMetrics', async () => {
      const oldMethodOverallMetrics = await client.getOverallMetrics(dateRange);

      console.log(oldMethodOverallMetrics);

      expect(oldMethodOverallMetrics).toEqual(overallMetrics);
    });
  });

  describe('executeMultiDayQuery', () => {
    let mockPreHook: jest.Mock;
    let mockPostHook: jest.Mock;

    let dateRange: DateRange;
    let pageMetrics: Partial<PageMetrics>[];
    let pageMetricsSearch: ReportSearch;

    beforeAll(async () => {
      mockPreHook = jest.fn();
      mockPostHook = jest.fn();

      dateRange = {
        start: toQueryFormat('2022-06-10'),
        end: toQueryFormat('2022-06-12'),
      };

      pageMetricsSearch = {
        clause: `BEGINS-WITH 'www.canada.ca/en/revenue-agency/services/payments-cra/business-payments.html'`,
      };

      pageMetrics = await client.executeMultiDayQuery<Partial<PageMetrics>>(
        dateRange,
        (singleDateRange: DateRange) =>
          createPageMetricsQuery(singleDateRange, {
            search: pageMetricsSearch,
          }),
        {
          pre: mockPreHook,
          post: mockPostHook,
        }
      );

      return pageMetrics;
    });

    it('should return page metrics results', () => {
      console.log(pageMetrics);

      expect(Array.isArray(pageMetrics)).toBe(true);
      expect(pageMetrics.length).toBe(2);
    });

    it('should call pre and post hooks for each query', async () => {
      expect(mockPreHook).toHaveBeenCalledTimes(2);
      expect(mockPostHook).toHaveBeenCalledTimes(2);
    });

    it('should have the same results as getPageMetrics', async () => {
      const oldMethodPageMetrics = await client.getPageMetrics(dateRange, {
        search: pageMetricsSearch,
      });

      console.log(oldMethodPageMetrics);

      expect(oldMethodPageMetrics).toEqual(pageMetrics);
    });
  });

  describe('itemIdz', () => {
    const dateRange = {
      start: toQueryFormat('2020-01-01'),
      end: toQueryFormat('2022-06-25'),
    };

    // do this for all itemIds, then replace with new implementation and do comparison tests
    //
    // then set up new implementions for breakdown queries and do comparisons
    //
    // once all implementations are done, replace class methods with new implementations
    // -> add some basic tests?
    //

    // @@@@@@@@@ <--------------------
    //
    // -(look into filtering garbage quickly?)
    //
    // -Set up db-updater to create Page documents for all URLs without a Page ref
    //  -via data-integrity script? but running it against newly fetched data
    //
    // -Run, populate, compare pages list (and Pages collection) before & after
    //
    // -Delete/rename aa_item_ids
    //
    // -> optimize parts of db update logic/queries?
    //    -especially pain points like titles/redirects (make skippable in db-cli?) & slow queries like page metrics ref checks
    //
    // -then should be good to push changes & update prod db (set up docker volume at the same time)
    //
    // -This should give us all pages & solve the "learn about your taxes" problem !!
    //
    // @@@@@@@@@ <--------------------

    // Add itemIds to Page documents
    // Add page refs + itemIds to page metrics
    // + add logic to addPageRefs or whatever in db-updater to add itemIds along w/ other stuff
    // + also when adding page metrics, check for existing page refs and add them if they don't exist
    //
    //
    // Then move on to populating the db w/ data from breakdown queries
    // + setting up db update logic

    it('should get internal search itemIds', async () => {
      type InternalSearchItemIdsResult = {
        url: string;
        itemid_internalsearch: string;
        visits: number;
      };

      const internalSearchItemIdResults =
        await client.executeQuery<InternalSearchItemIdsResult>(
          createInternalSearchItemIdsQuery(dateRange, { limit: 50000 }),
          {
            resultsParser: (columnIds, rows) =>
              rows.map(
                (row) =>
                  row.data.reduce(
                    (rowValues, value, index) => {
                      const columnId = columnIds[index];
                      rowValues[columnId] = value;
                      return rowValues;
                    },
                    {
                      url: row.value,
                      itemid_internalsearch: row.itemId,
                    }
                  ) as InternalSearchItemIdsResult
              ),
          }
        );

      const oldItemIds = JSON.parse(
        await readFile('./internalSearchItemIds.json', 'utf8')
      );

      expect(internalSearchItemIdResults).toEqual(oldItemIds);
    });

    it('should get page URL itemIds', async () => {
      type PageUrlItemIdsResult = {
        url: string;
        itemid_url: string;
        visits: number;
      };

      const pageUrlItemIdResults =
        await client.executeQuery<PageUrlItemIdsResult>(
          createPageUrlItemIdsQuery(dateRange, { limit: 50000 }),
          {
            resultsParser: (columnIds, rows) =>
              rows.map(
                (row) =>
                  row.data.reduce(
                    (rowValues, value, index) => {
                      const columnId = columnIds[index];
                      rowValues[columnId] = value;
                      return rowValues;
                    },
                    {
                      url: row.value,
                      itemid_url: row.itemId,
                    }
                  ) as PageUrlItemIdsResult
              ),
          }
        );

      const oldItemIds = JSON.parse(
        await readFile('./pageUrlItemIds.json', 'utf8')
      );

      expect(pageUrlItemIdResults).toEqual(oldItemIds);
    });

    it('should get activity map itemIds', async () => {
      type ActivityMapItemIdsResult = {
        title: string;
        itemid_activitymap: string;
        visits: number;
      };
      const activityMapItemIdResults =
        await client.executeQuery<ActivityMapItemIdsResult>(
          createActivityMapItemIdsQuery(dateRange, { limit: 50000 }),
          {
            resultsParser: (columnIds, rows) =>
              rows.map(
                (row) =>
                  row.data.reduce(
                    (rowValues, value, index) => {
                      const columnId = columnIds[index];
                      rowValues[columnId] = value;
                      return rowValues;
                    },
                    {
                      title: row.value,
                      itemid_activitymap: row.itemId,
                    }
                  ) as ActivityMapItemIdsResult
              ),
          }
        );

      const oldItemIds = JSON.parse(
        await readFile('./activityMapItemIds.json', 'utf8')
      );

      expect(activityMapItemIdResults).toEqual(oldItemIds);
    });
  });
});

describe('AA Breakdown Queries', () => {
  const dateRange = {
    start: toQueryFormat('2022-06-01'),
    end: toQueryFormat('2022-06-02'),
  };

  let client: AdobeAnalyticsClient;
  const internalSearchItemIds = [
    '4116743888',
    '3107157567',
    '1975508319',
    '3504622064',
    '403495139',
    '4276562219',
    '2012161981',
    '239295590',
    '3361630382',
    '2837082575',
    '2633178076',
    '2109160097',
    '523607933',
    '2912017580',
    '827326218',
    '598764664',
    '1794616512',
    '3032797539',
    '1779240014',
    '290871446',
    '3557546238',
    '3739559646',
    '2433158255',
    '4272560991',
    '1659055776',
  ];

  beforeAll(async () => {
    client = new AdobeAnalyticsClient();

    await client.initClient();
  });

  it('should get internal search item ids', async () => {
    const internalSearchItemIdResults = await client.getInternalSearchItemIds(
      dateRange,
      { limit: 25 }
    );
    const internalSearchItemIds = internalSearchItemIdResults.map(
      (item) => item.itemid_internalsearch
    );

    console.log(internalSearchItemIds);

    expect(internalSearchItemIds.length).toBeGreaterThan(0);
  });

  it('should get search phrases using the given itemIds', async () => {
    const searchPhrasesResults = await client.getPhrasesSearchedOnPage(
      dateRange,
      internalSearchItemIds
    );

    console.log(searchPhrasesResults);

    expect(searchPhrasesResults).toBeDefined();

    const resultKeys = Object.keys(searchPhrasesResults);
    expect(resultKeys.length).toBeGreaterThan(0);
    expect(Array.isArray(searchPhrasesResults[resultKeys[0]])).toBe(true);
  });
});

describe('Querybuilder', () => {
  const dateRange = {
    start: toQueryFormat('2022-06-01'),
    end: toQueryFormat('2022-06-02'),
  };

  it('should be able to initalize the query builder', async () => {
    const queryBuilder = new AdobeAnalyticsQueryBuilder();
    expect(queryBuilder).toBeDefined();
    expect(queryBuilder instanceof AdobeAnalyticsQueryBuilder).toBe(true);
  });

  it('should be able to build a query', async () => {
    const queryBuilder = new AdobeAnalyticsQueryBuilder();
    const query = queryBuilder
      .addMetric('metrics/visits', '1')
      .setDimension('variables/evar12')
      .setGlobalFilters([
        {
          type: 'dateRange',
          dateRange: `${dateRange.start}/${dateRange.end}`,
        },
        {
          type: 'segment',
          segmentId: SEGMENTS.cra,
        },
      ])
      .setSearch({
        clause:
          "( CONTAINS 'www.canada.ca/en/revenue-agency/services/e-services/cra-login-services.html' )" +
          " OR ( CONTAINS 'www.canada.ca/en/revenue-agency/services/e-services/represent-a-client.html' )",
      })
      .setSettings({ limit: 10 })
      .build();

    expect(query).toBeDefined();
  });

  it('should be able to get where visitors came from', async () => {
    const client = new AdobeAnalyticsClient();

    const results = await client.getPageUrlItemIds(dateRange);
    const array: string[] = [];

    results.forEach((result) => {
      array.push(result.pageurl_item_id);
    });

    console.log(array.length);

    const results2 = await client.getWhereVisitorsCameFrom(
      dateRange,
      array.slice(0, 1000)
    );
    console.log(results2);

    expect(results2).toBeDefined();
  });
  //
  // it('should be able to get internal searches', async () => {
  //   const client = new AdobeAnalyticsClient();
  //
  //   const results = await client.acquireInternalSearchItemId(dateRange);
  //   const array: string[] = [];
  //
  //   results.forEach((result) => {
  //     array.push(result.internalsearch_item_id);
  //   });
  //
  //   console.log(array.length);
  //
  //   const results2 = await client.getInternalSearches(
  //     dateRange,
  //     array.slice(0, 333)
  //   );
  //   console.log(results2);
  //
  //   expect(results2).toBeDefined();
  // });
  //
  // it('should be able to get activity map', async () => {
  //   const client = new AdobeAnalyticsClient();
  //
  //   const results = await client.acquireActivityMapItemId(dateRange);
  //   const array: string[] = [];
  //
  //   results.forEach((result) => {
  //     array.push(result.activitymap_item_id);
  //   });
  //
  //   console.log(array.length);
  //
  //   const results2 = await client.getActivityMap(
  //     dateRange,
  //     array.slice(0, 1000)
  //   );
  //   console.log(results2);
  //
  //   expect(results2).toBeDefined();
  // });
});
