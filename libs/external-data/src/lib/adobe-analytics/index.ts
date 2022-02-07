import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

export * from './client';
export * from './querybuilder';
export * from './queries';
export * from './aa-dimensions';
export * from './aa-metrics';

import { Overall, PageMetrics } from '@cra-arc/db';
import { AnalyticsCoreAPI, getAAClient } from './client';
import {
  createExamplePageBreakdownMetricsQuery,
  createOverallMetricsQuery,
  createPageMetricsQuery,
} from './queries';
import { ReportSettings, ReportSearch } from './querybuilder';

dayjs.extend(utc);

export type DateRange = {
  start: string;
  end: string;
};

export class AdobeAnalyticsClient {
  client: AnalyticsCoreAPI;

  async initClient() {
    this.client = await getAAClient();
  }

  async getOverallMetrics(
    dateRange: DateRange,
    options?: ReportSettings
  ): Promise<Partial<Overall>[]> {
    if (!this.client) {
      await this.initClient();
    }

    const overallMetricsQuery = createOverallMetricsQuery(dateRange, options);

    // removed timeout for now
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

  // todo: refactor to use single date instead of a range
  async getPageMetrics(
    dateRange: DateRange,
    options?: { settings?: ReportSettings; search?: ReportSearch }
  ): Promise<Partial<PageMetrics[]>> {
    if (!this.client) {
      await this.initClient();
    }

    const pageMetricsQuery = createPageMetricsQuery(dateRange, options);
    const results = await this.client.getReport(pageMetricsQuery);

    const { columnIds } = results.body.columns;

    return results.body.rows.reduce((parsedResults, row) => {
      // the 'Z' means the date is UTC, so no conversion required
      const date = new Date(dateRange.start + 'Z');

      // build up results object using columnIds as keys
      const newPageMetricsData = row.data.reduce(
        (rowValues, value, index) => {
          const columnId = columnIds[index];
          rowValues[columnId] = value;

          return rowValues;
        },
        { date, url: row.value } as Partial<PageMetrics>
      );

      return [...parsedResults, newPageMetricsData];
    }, [] as Partial<PageMetrics>[]);
  }

  async getExamplePageBreakdownMetrics(dateRange: DateRange): Promise<any[]> {
    if (!this.client) {
      await this.initClient();
    }

    const pageBreakdownMetricsQuery = createExamplePageBreakdownMetricsQuery(dateRange);
    const results = await this.client.getReport(pageBreakdownMetricsQuery);

    return results.body;
  }
}
