import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Overall, PageMetrics } from '@dua-upd/db';
import { AnalyticsCoreAPI, getAAClient } from './client';
import {
  createActivityMapQuery,
  createCXTasksQuery,
  createInternalSearchQuery,
  createOverallMetricsQuery,
  createPageMetricsQuery,
  acquireActivityMapItemIdQuery,
  acquireInternalSearchItemIdQuery,
  createPhrasesSearchedOnPageQuery,
  acquirePageUrlItemIdQuery,
  createWhereVisitorsCameFromQuery,
} from './queries';
import { queryDateFormat, ReportSearch, ReportSettings } from './querybuilder';
import { DateRange } from '../types';
import { datesFromDateRange } from '../utils';
import { wait, sortArrayDesc, seperateArray } from '@dua-upd/utils-common';

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

  async getPageMetrics(
    dateRange: DateRange,
    options?: {
      settings?: ReportSettings;
      search?: ReportSearch;
      postProcess?: (data: Partial<PageMetrics[]>) => unknown | void;
    }
  ): Promise<Partial<PageMetrics[]>[]> {
    if (!this.client || this.clientTokenIsExpired()) {
      if (this.clientTokenIsExpired()) {
        console.log('Client token is expired, refreshing.');
      }

      await this.initClient();
    }

    const dateRanges = datesFromDateRange(dateRange, queryDateFormat)
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

    for (const dateRange of dateRanges) {
      console.log('Creating Pages Metrics query for date range:', dateRange);

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
                aa_item_id: row.itemId,
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

  async acquirePageUrlItemId(
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

    const acquirePageUrlItemId = acquirePageUrlItemIdQuery(dateRange, options);
    const results = await this.client.getReport(acquirePageUrlItemId);

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
          url: row.value,
          pageurl_item_id: row.itemId,
        }
      );

      return [...parsedResults, newPageMetricsData];
    }, []);
  }

  async acquireActivityMapItemId(
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

    const acquireActivityMapItemId = acquireActivityMapItemIdQuery(
      dateRange,
      options
    );
    const results = await this.client.getReport(acquireActivityMapItemId);

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
          activitymap_item_id: row.itemId,
        }
      );

      return [...parsedResults, newPageMetricsData];
    }, []);
  }

  async acquireInternalSearchItemId(
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

    const acquireInternalSearchItemId = acquireInternalSearchItemIdQuery(
      dateRange,
      options
    );
    const results = await this.client.getReport(acquireInternalSearchItemId);

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
          url: row.value,
          internalsearch_item_id: row.itemId,
        }
      );

      return [...parsedResults, newPageMetricsData];
    }, []);
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
