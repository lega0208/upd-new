import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { type AASearchTermMetrics, Overall, PageMetrics } from '@dua-upd/db';
import {
  wait,
  sortArrayDesc,
  seperateArray,
  AsyncLogTiming,
} from '@dua-upd/utils-common';
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
  type AdobeAnalyticsReportQuery,
  queryDateFormat,
  type ReportSearch,
  type ReportSettings,
} from './querybuilder';
import type {
  AAMaybeResponse,
  AAQueryCreatorParam,
  AAResponse,
  AAResultsParser,
  AAResultsRow,
  DateRange,
} from '../types';
import { singleDatesFromDateRange, withRetry } from '../utils';
import { ConsoleLogger } from '@nestjs/common';
import chalk from 'chalk';

export * from './client';
export * from './querybuilder';
export * from './queries';
export * from './aa-dimensions';
export * from './aa-metrics';
export * from '../types';

dayjs.extend(utc);

export class AdobeAnalyticsClient {
  client: AnalyticsCoreAPI;
  clientTokenExpiry: number;

  constructor(
    clientTokenExpiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    private logger: Console | ConsoleLogger = console
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
    queryCreator: AAQueryCreatorParam,
    inclusiveEndDate = false
  ) {
    const dateRanges = singleDatesFromDateRange(
      dateRange,
      queryDateFormat,
      inclusiveEndDate
    )
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

  @AsyncLogTiming
  async executeQuery<T = AAResponse>(
    query: AdobeAnalyticsReportQuery,
    options: {
      resultsParser?: AAResultsParser<T>;
      hooks?: {
        pre?: (dateRange: string | DateRange) => void;
        post?: <U>(data: T[]) => U extends Promise<unknown> ? U : Promise<U>;
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

    // This is only used to log the dateRange for now
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
      return Promise.resolve(parsedResults).then(
        (results) =>
          options.hooks.post(results) as T extends AAResponse ? AAResponse : T[]
      );
    }

    return parsedResults as T extends AAResponse ? AAResponse : T[];
  }

  get executeQueryWithRetry() {
    return withRetry(this.executeQuery.bind(this), 5, 550);
  }

  async executeMultiDayQuery<T>(
    dateRange: DateRange,
    queryCreator: AAQueryCreatorParam,
    hooks?: {
      pre?: (dateRange: string | DateRange) => void;
      post?: (data: T[]) => void;
    },
    inclusiveEndDate = false,
    maxParallel = 12
  ): Promise<void> {
    const queries = this.createMultiDayQueries(
      dateRange,
      queryCreator,
      inclusiveEndDate
    );

    const promises = [];

    for (const query of queries) {
      const executeQueryWithRetry = withRetry(
        this.executeQuery.bind(this),
        2,
        520
      );

      const promise = executeQueryWithRetry<T>(query, {
        hooks,
      });

      promises.push(promise);

      if (promises.length % maxParallel === 0) {
        await Promise.all([
          wait(520),
          ...promises.splice(0, maxParallel),
        ]).catch((err) => {
          this.logger.error(
            chalk.red(
              'An error occurred while waiting for a batch to complete:'
            )
          );
          this.logger.error(chalk.red(err.stack));
        });
      }

      await wait(520);
    }

    await Promise.all(promises).catch((err) => {
      this.logger.error(chalk.red(err.stack));
    });

    return await Promise.resolve();
  }

  async getOverallMetrics(
    dateRange: DateRange,
    options: ReportSettings = {}
  ): Promise<Partial<Overall>[]> {
    if (!this.client || this.clientTokenIsExpired()) {
      await this.initClient();
    }

    options = {
      limit: 20000,
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

  // make sure url_last_255 itemIds get captured ***** @@
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

      await wait(520);
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

  @AsyncLogTiming
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
      'Expected global daterange filter at index 1 in AA query, but none was found'
    );
  }

  const { startDate } = parseQueryDateRange(dateRangeFilter);

  // for itemId queries // (just internal search for now)
  if (dimension === 'variables/evar52') {
    return (columnIds: string[], rows: AAResultsRow[]) =>
      rows.map(
        // currently ignoring the data because we don't need it
        (row) =>
          ({
            itemId: row.itemId,
            value: row.value,
            type: 'internalSearch',
          } as T)
      );
  }

  const metricFilter = query.metricContainer.metricFilters?.[0];
  const queryHasItemIds = metricFilter?.itemIds?.length || metricFilter?.itemId;

  // for overall search phrases
  if (dimension === 'variables/evar50' && !queryHasItemIds) {
    return (columnIds, rows) =>
      rows.map(
        (row) =>
          row.data.reduce(
            (parsedRow, value, index) => {
              const columnId = columnIds[index];

              if (value !== 'NaN') {
                parsedRow[columnId] = value;
              }

              return parsedRow;
            },
            {
              date: new Date(startDate),
              term: row.value,
            }
          ) as T
      );
  }

  // for page search phrases
  if (dimension === 'variables/evar50' && queryHasItemIds) {
    return (columnIds: string[], rows: AAResultsRow[]) => {
      const searchTermResults = rows.map((row) => {
        return row.data.reduce(
          (parsedRow, value, index) => {
            const columnId = columnIds[index];

            if (value !== 0 && value !== 'NaN') {
              parsedRow[columnId] = value;
            }

            return parsedRow;
          },
          {
            date: startDate,
            term: row.value,
          }
        );
      }) as ({ date: Date; term: string } & { [data: string]: number })[];

      const resultsByItemId: Record<string, AASearchTermMetrics[]> = {};

      for (const searchTermResult of searchTermResults) {
        const { date, term } = searchTermResult;

        const reformatted = Object.entries(searchTermResult)
          .filter(([key, val]) => key !== 'date' && key !== 'term')
          .reduce((resultsById, [key, val]) => {
            const [metricName, itemId] = key.split('-');

            if (!resultsById[itemId]) {
              resultsById[itemId] = {};
            }

            if (resultsById[itemId][metricName]) {
              throw Error(
                'Tried to assign a value to a key that already exists:\r\n' +
                  `itemId: ${itemId}, metric name: ${metricName},` +
                  `value: ${val}, existing value: ${resultsById[itemId][metricName]}`
              );
            }

            resultsById[itemId][metricName] = val;

            return resultsById;
          }, {}) as { [itemId: string]: { clicks: number; position: number } };

        for (const itemId of Object.keys(reformatted)) {
          if (!resultsByItemId[itemId]) {
            resultsByItemId[itemId] = [];
          }

          resultsByItemId[itemId].push({
            term,
            ...reformatted[itemId],
          });
        }
      }

      return Object.entries(resultsByItemId).map(
        ([itemId, aa_searchterms]) =>
          ({
            itemId,
            aa_searchterms,
          } as T)
      );
    };
  }

  // only overall metrics need variables/daterangeday at the moment
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
