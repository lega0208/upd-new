import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Overall, PageMetrics } from '@cra-arc/db';
import { AnalyticsCoreAPI, getAAClient } from './client';
import {
  createExamplePageBreakdownMetricsQuery,
  createOverallMetricsQuery,
  createPageMetricsQuery,
} from './queries';
import { queryDateFormat, ReportSearch, ReportSettings } from './querybuilder';
import { DateRange } from '../types';
import { datesFromDateRange } from '../utils';
import { wait } from '@cra-arc/utils-common';

export * from './client';
export * from './querybuilder';
export * from './queries';
export * from './aa-dimensions';
export * from './aa-metrics';

dayjs.extend(utc);

export class AdobeAnalyticsClient {
  client: AnalyticsCoreAPI;

  async initClient() {
    this.client = await getAAClient();
  }

  async getOverallMetrics(
    dateRange: DateRange,
    options: ReportSettings = {}
  ): Promise<Partial<Overall>[]> {
    if (!this.client) {
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
      postProcess?: (
        data: Partial<PageMetrics[]>
      ) => unknown | void;
    }
  ): Promise<Partial<PageMetrics[]>[]> {
    if (!this.client) {
      await this.initClient();
    }
    const dateRanges = datesFromDateRange(dateRange, queryDateFormat).map(
      (date) => ({
        start: date,
        end: dayjs(date).add(1, 'day').format(queryDateFormat),
      })
    );
    const promises = [];

    for (const dateRange of dateRanges) {
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
              { date, url: row.value, aa_item_id: row.itemId } as Partial<PageMetrics>
            );

            return [...parsedResults, newPageMetricsData];
          }, [] as Partial<PageMetrics>[]);
        });

      if (options?.postProcess) {
        promises.push(
          promise.then(options.postProcess)
            .then((data) => console.log(`Successfully inserted data for ${data?.modifiedCount} pages`))
        );
      } else {
        promises.push(promise);
      }

      await wait(500);
    }

    return await Promise.all(promises);
  }

  async getExamplePageBreakdownMetrics(dateRange: DateRange): Promise<any[]> {
    if (!this.client) {
      await this.initClient();
    }

    const pageBreakdownMetricsQuery =
      createExamplePageBreakdownMetricsQuery(dateRange);
    const results = await this.client.getReport(pageBreakdownMetricsQuery);

    return results.body;
  }
}
