import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Overall, PageMetrics } from '@dua-upd/db';
import { wait, sortArrayDesc, seperateArray } from '@dua-upd/utils-common';
import { AnalyticsCoreAPI, getAAClient } from './client';
import {
  createActivityMapQuery,
  createCXTasksQuery,
  createInternalSearchQuery,
  createOverallMetricsQuery,
  createPageMetricsQuery,
  createActivityMapItemIdsQuery,
  createInternalSearchItemIdsQuery,
  createPhrasesSearchedOnPageQuery,
  createPageUrlItemIdsQuery,
  createWhereVisitorsCameFromQuery,
  createPhraseItemIdsQuery,
  createPhraseRankingQuery,
  createPhraseMostClickedQuery,
} from './queries';
import {
  AdobeAnalyticsReportQuery,
  queryDateFormat,
  ReportSearch,
  ReportSettings,
} from './querybuilder';
import {
  AAMaybeResponse,
  AAQueryCreatorParam,
  AAResponse,
  AAResultsParser,
  AAResultsRow,
  DateRange,
} from '../types';
import { singleDatesFromDateRange } from '../utils';

export * from './client';
export * from './querybuilder';
export * from './queries';
export * from './aa-dimensions';
export * from './aa-metrics';

dayjs.extend(utc);

export class AdobeAnalyticsClient {
  client: AnalyticsCoreAPI;
  clientTokenExpiry: number;

  constructor(
    clientTokenExpiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60
  ) {
    this.clientTokenExpiry = clientTokenExpiry;
  }

  async initClient(
    clientTokenExpiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60
  ) {
    this.clientTokenExpiry = clientTokenExpiry;

    this.client = await getAAClient(clientTokenExpiry);

    return this.client;
  }

  clientTokenIsExpired() {
    return this.clientTokenExpiry < Math.floor(Date.now() / 1000);
  }

  // Creates an array of single-day queries from a date range and query creator function
  createMultiDayQueries(
    dateRange: DateRange,
    queryCreator: AAQueryCreatorParam
  ) {
    const dateRanges = singleDatesFromDateRange(dateRange, queryDateFormat)
      .map((date) => ({
        start: date,
        end: dayjs.utc(date).add(1, 'day').format(queryDateFormat),
      }))
      .filter(
        (dateRange) =>
          dayjs.utc(dateRange.start).startOf('day') !==
          dayjs.utc().startOf('day')
      );

    return dateRanges.map((dateRange) => queryCreator(dateRange));
  }

  async executeQuery<T = AAResponse>(
    query: AdobeAnalyticsReportQuery,
    options: {
      resultsParser?: AAResultsParser<T>;
      hooks?: {
        pre?: (dateRange: string | DateRange) => void;
        post?: (data: T[]) => void;
      };
      parseResults?: boolean;
    } = {}
  ): Promise<T extends AAResponse ? AAResponse : T[]> {
    if (!this.client || this.clientTokenIsExpired()) {
      if (this.clientTokenIsExpired()) {
        console.log('Client token is expired, refreshing.');
      }

      await this.initClient();
    }

    if (options.hooks?.pre) {
      options.hooks.pre(query.globalFilters[1].dateRange);
    }

    const results: AAMaybeResponse = await this.client.getReport(query);

    if ('errorCode' in results.body) {
      throw new Error(`Error response received from AA API call:
      Error code ${results.body.errorCode}: ${results.body.errorDescription}`);
    }

    // should strictly equal false, undefined means default behaviour
    if (options.parseResults === false) {
      return results as T extends AAResponse ? AAResponse : T[];
    }

    const resultsParser = options.resultsParser || createRowsParser<T>(query);

    const { columnIds } = results.body.columns;

    const parsedResults = resultsParser(columnIds, results.body.rows);

    if (options.hooks?.post) {
      return Promise.resolve(parsedResults).then((results) => {
        options.hooks.post(results);

        return results as T extends AAResponse ? AAResponse : T[];
      });
    }

    return parsedResults as T extends AAResponse ? AAResponse : T[];
  }

  async executeMultiDayQuery<T>(
    dateRange: DateRange,
    queryCreator: AAQueryCreatorParam,
    hooks?: {
      pre?: (dateRange: string | DateRange) => void;
      post?: (data: T[]) => void;
    }
  ): Promise<T[]> {
    const queries = this.createMultiDayQueries(dateRange, queryCreator);

    const promises = [];

    for (const query of queries) {
      const promise = this.executeQuery<T>(query, { hooks });

      promises.push(promise);

      await wait(500);
    }

    // todo: batchAwait

    return Promise.all<T>(promises);
  }

  async getOverallMetrics(
    dateRange: DateRange,
    options: ReportSettings = {}
  ): Promise<Partial<Overall>[]> {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 400,
      ...options,
    };

    const overallMetricsQuery = createOverallMetricsQuery(dateRange, options);

    const results = await this.client.getReport(overallMetricsQuery);

    const { columnIds } = results.body.columns;

    return (
      results.body.rows
        // need to filter out extra day from bouncerate bug
        .filter(({ value }) => {
          const rowDate = dayjs(value).utc(true).toDate();
          const startDate = dayjs(dateRange.start).utc(true).toDate();

          return rowDate >= startDate;
        })
        .reduce((parsedResults, row) => {
          // reformat date to iso string and convert to Date object
          const date = dayjs(row.value).utc(true).toDate();

          // build up results object using columnIds as keys
          const newDailyData = row.data.reduce(
            (rowValues, value, index) => {
              const columnId = columnIds[index];
              rowValues[columnId] = value;
              return rowValues;
            },
            { date } as Partial<Overall>
          );

          return [...parsedResults, newDailyData];
        }, [] as Partial<Overall>[])
    );
  }

  async getPageMetrics(
    dateRange: DateRange,
    options?: {
      settings?: ReportSettings;
      search?: ReportSearch;
      postProcess?: (data: Partial<PageMetrics[]>) => unknown | void;
      segment?: string;
    }
  ): Promise<Partial<PageMetrics[]>[]> {
    if (!this.client || this.clientTokenIsExpired()) {
      if (this.clientTokenIsExpired()) {
        console.log('Client token is expired, refreshing.');
      }

      await this.initClient();
    }

    const dateRanges = singleDatesFromDateRange(dateRange, queryDateFormat)
      .map((date) => ({
        start: date,
        end: dayjs.utc(date).add(1, 'day').format(queryDateFormat),
      }))
      .filter(
        (dateRange) =>
          dayjs.utc(dateRange.start).startOf('day') !==
          dayjs.utc().startOf('day')
      );
    const promises = [];

    console.log('AA dateRanges', dateRanges);

    for (const dateRange of dateRanges) {
      if (promises.length % 5 === 0) {
        await Promise.all(promises);
      }
      console.log('Creating AA Page Metrics query for date range:', dateRange);

      const pageMetricsQuery = createPageMetricsQuery(dateRange, options);
      const promise = this.client
        .getReport(pageMetricsQuery)
        .then((results) => {
          const { columnIds } = results.body.columns;

          return results.body.rows.reduce((parsedResults, row) => {
            // the 'Z' means the date is UTC, so no conversion required
            const date = new Date(dateRange.start + 'Z');

            // build up results object using columnIds as keys
            const newPageMetricsData = row.data.reduce(
              (rowValues, value, index) => {
                const columnId = columnIds[index];

                if (columnId === 'bouncerate' && value === 'NaN') {
                  rowValues[columnId] = 0;
                } else {
                  rowValues[columnId] = value;
                }

                return rowValues;
              },
              {
                date,
                url: row.value,
              } as Partial<PageMetrics>
            );

            return [...parsedResults, newPageMetricsData];
          }, [] as Partial<PageMetrics>[]);
        });

      if (options?.postProcess) {
        promises.push(
          promise
            .then(options.postProcess)
            .then((data) =>
              console.log(
                `Successfully inserted data for ${data?.modifiedCount} pages`
              )
            )
        );
      } else {
        promises.push(promise);
      }

      await wait(500);
    }

    return await Promise.all(promises);
  }

  async getOverallCXMetrics(
    dateRange: DateRange,
    options: ReportSettings = {}
  ): Promise<Partial<Overall>[]> {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 400,
      ...options,
    };

    const overallMetricsCXQuery = createCXTasksQuery(dateRange, options);

    const results = await this.client.getReport(overallMetricsCXQuery);

    // todo: should probably handle results having more than 1 "page" (i.e. paginated results)
    const { columnIds } = results.body.columns;

    return (
      results.body.rows
        // need to filter out extra day from bouncerate bug
        .filter(({ value }) => {
          const rowDate = dayjs(value).utc(true).toDate();
          const startDate = dayjs(dateRange.start).utc(true).toDate();

          return rowDate >= startDate;
        })
        .reduce((parsedResults, row) => {
          // reformat date to iso string and convert to Date object
          const date = dayjs(row.value).utc(true).toDate();

          // build up results object using columnIds as keys
          const newDailyData = row.data.reduce(
            (rowValues, value, index) => {
              const columnId = columnIds[index];
              rowValues[columnId] = value;
              return rowValues;
            },
            { date } as Partial<Overall>
          );

          return [...parsedResults, newDailyData];
        }, [] as Partial<Overall>[])
    );
  }

  async getPageUrlItemIds(dateRange: DateRange, options: ReportSettings = {}) {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 50000,
      ...options,
    };

    const itemIdsQuery = createPageUrlItemIdsQuery(dateRange, options);
    const results = await this.client.getReport(itemIdsQuery);

    const { columnIds } = results.body.columns;

    return results.body.rows.reduce((parsedResults, row) => {
      // build up results object using columnIds as keys
      const newPageMetricsData = row.data.reduce(
        (rowValues, value, index) => {
          const columnId = columnIds[index];
          rowValues[columnId] = value;
          return rowValues;
        },
        {
          url: row.value,
          itemid_url: row.itemId,
        }
      );

      return [...parsedResults, newPageMetricsData];
    }, []);
  }

  async getActivityMapItemIds(
    dateRange: DateRange,
    options: ReportSettings = {}
  ) {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 50000,
      ...options,
    };

    const itemIdsQuery = createActivityMapItemIdsQuery(dateRange, options);
    const results = await this.client.getReport(itemIdsQuery);

    const { columnIds } = results.body.columns;

    //return results;

    return results.body.rows.reduce((parsedResults, row) => {
      // build up results object using columnIds as keys
      const newPageMetricsData = row.data.reduce(
        (rowValues, value, index) => {
          const columnId = columnIds[index];
          rowValues[columnId] = value;
          return rowValues;
        },
        {
          title: row.value,
          itemid_activitymap: row.itemId,
        }
      );

      return [...parsedResults, newPageMetricsData];
    }, []);
  }

  async getInternalSearchItemIds(
    dateRange: DateRange,
    options: ReportSettings = {}
  ) {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 50000,
      ...options,
    };

    const internalSearchItemIdsQuery = createInternalSearchItemIdsQuery(
      dateRange,
      options
    );
    const results = await this.client.getReport(internalSearchItemIdsQuery);

    const { columnIds } = results.body.columns;

    return results.body.rows.reduce((parsedResults, row) => {
      // build up results object using columnIds as keys
      const newPageMetricsData = row.data.reduce(
        (rowValues, value, index) => {
          const columnId = columnIds[index];
          rowValues[columnId] = value;
          return rowValues;
        },
        {
          url: row.value,
          itemid_internalsearch: row.itemId,
        }
      );

      return [...parsedResults, newPageMetricsData];
    }, []) as { url: string; itemid_internalsearch: string }[];
  }

  async getPhraseItemIds(
    dateRange: DateRange,
    lang,
    options: ReportSettings = {}
  ) {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 100,
      ...options,
    };

    const phraseItemIdsQuery = createPhraseItemIdsQuery(
      dateRange,
      lang,
      options
    );
    const results = await this.client.getReport(phraseItemIdsQuery);

    const { columnIds } = results.body.columns;

    return results.body.rows.reduce((parsedResults, row) => {
      // build up results object using columnIds as keys
      const newPageMetricsData = row.data.reduce(
        (rowValues, value, index) => {
          const columnId = columnIds[index];
          rowValues[columnId] = value;
          return rowValues;
        },
        {
          phrase: row.value,
          itemid_phrase: row.itemId,
        }
      );

      return [...parsedResults, newPageMetricsData];
    }, []) as { phrase: string; itemid_phrase: string }[];
  }

  async getPhrase(
    dateRange: DateRange,
    itemIds: string[],
    lang = 'en',
    options: ReportSettings = {}
  ) {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 50000,
      ...options,
    };

    const activityMapQuery = createPhraseRankingQuery(
      dateRange,
      itemIds,
      lang,
      options
    );
    const results = await this.client.getReport(activityMapQuery);

    // the 'Z' means the date is UTC, so no conversion required
    const date = new Date(dateRange.start + 'Z');

    return sortArrayDesc(seperateArray(results.body.rows))
      .map((row) => {
        return row.map((v) => {
          return {
            link: v.value,
            rank: Math.round(v.data),
          };
        });
      })
      .map((row) => {
        return row
          .filter((v) => {
            return isFinite(v.rank);
          })
          .sort((a, b) => {
            return a.rank - b.rank;
          });
      })
      .map((row, i) => {
        return {
          data: [...row],
          date: date.toISOString(),
          itemid_phrase: itemIds[i],
        };
      });
  }

  async getActivityMap(
    dateRange: DateRange,
    itemIds: string[],
    options: ReportSettings = {}
  ) {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 50000,
      ...options,
    };

    const activityMapQuery = createActivityMapQuery(
      dateRange,
      itemIds,
      options
    );
    const results = await this.client.getReport(activityMapQuery);

    const { columnIds } = results.body.columns;

    // the 'Z' means the date is UTC, so no conversion required
    const date = new Date(dateRange.start + 'Z');

    //return results;

    return sortArrayDesc(seperateArray(results.body.rows))
      .map((row) => {
        return row.map((v) => {
          return {
            link: v.value,
            clicks: v.data,
          };
        });
      })
      .reduce(
        (rowValues, value, index) => {
          const columnId = columnIds[index];
          rowValues[columnId] = value;
          return rowValues;
        },
        { date } as any
      );
  }

  async getWhereVisitorsCameFrom(
    dateRange: DateRange,
    itemIds: string[],
    options: ReportSettings = {}
  ) {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 50000,
      ...options,
    };

    const whereVisitorsCameFromQuery = createWhereVisitorsCameFromQuery(
      dateRange,
      itemIds,
      options
    );
    const results = await this.client.getReport(whereVisitorsCameFromQuery);

    const { columnIds } = results.body.columns;

    // the 'Z' means the date is UTC, so no conversion required
    const date = new Date(dateRange.start + 'Z');

    //return results;

    return sortArrayDesc(seperateArray(results.body.rows))
      .map((row) => {
        return row.map((v) => {
          return {
            link: v.value,
            visits: v.data,
          };
        });
      })
      .reduce(
        (rowValues, value, index) => {
          const columnId = columnIds[index];
          rowValues[columnId] = value;
          return rowValues;
        },
        { date } as any
      );
  }

  async getInternalSearches(
    dateRange: DateRange,
    itemIds: string[],
    options: ReportSettings = {}
  ) {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 50000,
      page: 0,
      ...options,
    };

    const internalSearchQuery = createInternalSearchQuery(
      dateRange,
      itemIds,
      options
    );
    const results = await this.client.getReport(internalSearchQuery);

    const { columnIds } = results.body.columns;

    // the 'Z' means the date is UTC, so no conversion required
    const date = new Date(dateRange.start + 'Z');

    //return results;

    return sortArrayDesc(seperateArray(results.body.rows))
      .map((row) => {
        return row.map((v) => {
          return {
            phrase: v.value,
            clicks: v.data,
          };
        });
      })
      .reduce(
        (rowValues, value, index) => {
          const columnId = columnIds[index];
          rowValues[columnId] = value;
          return rowValues;
        },
        { date } as any
      );
  }

  async getPhrasesSearchedOnPage(
    dateRange: DateRange,
    itemIds: string[],
    options: ReportSettings = {}
  ) {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 50000,
      page: 0,
      ...options,
    };

    const internalSearchQuery = createPhrasesSearchedOnPageQuery(
      dateRange,
      itemIds,
      options
    );
    const results = await this.client.getReport(internalSearchQuery);

    const { columnIds } = results.body.columns;

    // the 'Z' means the date is UTC, so no conversion required
    const date = new Date(dateRange.start + 'Z');

    //return results;

    return sortArrayDesc(seperateArray(results.body.rows))
      .map((row) => {
        return row.map((v) => {
          return {
            phrase: v.value,
            clicks: v.data,
          };
        });
      })
      .reduce(
        (rowValues, value, index) => {
          const columnId = columnIds[index];
          rowValues[columnId] = value;
          return rowValues;
        },
        { date } as any
      );
  }
}

export function createRowsParser<T>(
  query: AdobeAnalyticsReportQuery
): AAResultsParser<T> {
  const dimension = query.dimension;

  // globalFilters should be [segment, dateRange]
  const dateRangeFilter = query.globalFilters?.[1]?.dateRange;

  if (!dateRangeFilter) {
    throw new Error(
      'Expected global daterange filter in AA query, but none was found'
    );
  }

  const { startDate } = parseQueryDateRange(dateRangeFilter);

  if (dimension !== 'variables/daterangeday') {
    return (columnIds: string[], rows: AAResultsRow[]) =>
      rows.map((row) =>
        row.data.reduce(
          (parsedRow, value, index) => {
            const columnId = columnIds[index];

            if (columnId === 'bouncerate' && value === 'NaN') {
              parsedRow[columnId] = 0;
            } else {
              parsedRow[columnId] = value;
            }

            return parsedRow;
          },
          { date: startDate, url: row.value } as unknown as Partial<T>
        )
      ) as T[];
  }

  return (columnIds: string[], rows: AAResultsRow[]) => {
    // need to filter out extra day from bouncerate bug
    return rows
      .filter((row) => {
        const rowDate = new Date(row.value + 'Z');

        return rowDate >= startDate;
      })
      .map((row) => {
        const date = new Date(row.value + 'Z');

        return row.data.reduce(
          (parsedRow, value, index) => {
            const columnId = columnIds[index];

            parsedRow[columnId] = value;

            return parsedRow;
          },
          { date } as unknown as T
        );
      }) as T[];
  };
}

export function parseQueryDateRange(dateRange: string) {
  const results = /^(.+?)\/(.+$)/.exec(dateRange);

  if (!results || !results.length || results.length < 3) {
    throw new Error(
      'Error parsing dates from date range filter in AA query. dateRange: ' +
        dateRange
    );
  }

  // the 'Z' means the timezone is UTC, so no conversion required
  const startDate = new Date(results[1] + 'Z');
  const endDate = new Date(results[2] + 'Z');

  return {
    startDate,
    endDate,
  };
}
