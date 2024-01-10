import { CustomReportsMetrics } from '@dua-upd/db';
import { type AAResponseBody, queryDateFormat } from '@dua-upd/external-data';
import type {
  AAMetricName,
  AAQueryConfig,
  AAQueryDateRange,
  ReportConfig,
} from '@dua-upd/types-common';
import { AADimensionName } from '@dua-upd/types-common';
import { dateRangeToGranularity } from '@dua-upd/utils-common';
import { mongo, Types } from 'mongoose';
import type { ReportDataPoint } from './custom-reports.service';

// may very well be unnecessary
/**
 * A strategy to define the logic for each step of the pipeline,
 *  to be selected based on the report config.
 */
export interface CustomReportsStrategy {
  /**
   * Parse the query results into a list of bulk write operations for inserting
   * into the database.
   * @param query
   * @param dataPoints
   * @param results
   */
  parseQueryResults<R extends AAResponseBody>(
    query: AAQueryConfig,
    dataPoints: ReportDataPoint[],
    results: R,
  ): mongo.AnyBulkWriteOperation<CustomReportsMetrics>[];
}

/**
 * Derive the individual data points to be inserted from query results into the database.
 * To be used for identifying data points, for checking whether they already exist
 * in the db or will be processed by a currently running job.
 *
 * @param reportConfig The report config.
 * @param queryConfig The query config.
 */
export function deriveDataPoints(
  reportConfig: ReportConfig,
  queryConfig: AAQueryConfig,
): ReportDataPoint[] {
  const { grouped, granularity, breakdownDimension } = reportConfig;
  const { urls: _urls, metricNames, dateRange } = queryConfig;

  const urls = Array.isArray(_urls) ? _urls : [_urls];
  const metrics = Array.isArray(metricNames) ? metricNames : [metricNames];
  const dimension = breakdownDimension
    ? { breakdownDimension: breakdownDimension as AADimensionName }
    : {};

  const commonOutput = {
    startDate: new Date(dateRange.start),
    endDate: new Date(dateRange.end),
    granularity,
    grouped,
    ...dimension,
  };

  if (grouped) {
    return [
      {
        ...commonOutput,
        urls,
        metrics,
      },
    ];
  }

  return urls.map((url) => ({
    ...commonOutput,
    url,
    metrics,
  }));
}

/**
 * Decompose the report config into a list queries for granular data, along with
 * a list of the individual data points to be inserted (to be used for tracking/reuse).
 * @param config The report config.
 */
export function decomposeConfig(config: ReportConfig) {
  const {
    dateRange,
    granularity,
    urls,
    metrics: metricNames,
    grouped,
    breakdownDimension,
  } = config;

  const dateRanges = (
    granularity === 'none'
      ? [dateRange]
      : dateRangeToGranularity(dateRange, granularity, queryDateFormat)
  ) as AAQueryDateRange[];

  const dimensionName: AADimensionName =
    breakdownDimension || (grouped ? 'none' : 'url_last_255');

  const toQueryConfig = (dateRange: AAQueryDateRange, urls: string[]) =>
    ({
      dateRange,
      metricNames,
      dimensionName,
      urls,
    }) as AAQueryConfig;

  const queries = dateRanges.flatMap((dateRange) =>
    !grouped && breakdownDimension
      ? urls.map((url) => toQueryConfig(dateRange, [url]))
      : [toQueryConfig(dateRange, urls)],
  );

  return queries.map((query) => ({
    query,
    dataPoints: deriveDataPoints(config, query),
  }));
}

export function dataPointToBulkInsert(
  dataPoint: ReportDataPoint,
  metrics: mongo.MatchKeysAndValues<CustomReportsMetrics>,
): mongo.AnyBulkWriteOperation<CustomReportsMetrics> {
  const { startDate, endDate, url, urls, grouped, granularity } = dataPoint;

  if (grouped && !urls?.length) {
    throw new Error('No urls found for grouped data point');
  }

  const dates =
    granularity === 'day'
      ? {
          startDate: new Date(startDate),
        }
      : {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        };

  const datesGroupedGranularity = {
    ...dates,
    grouped,
    granularity,
  };

  const filter = grouped
    ? {
        urls: {
          $all: urls?.map((url) => ({ $elemMatch: { $eq: url } })),
          $size: urls?.length,
        },
        ...datesGroupedGranularity,
      }
    : {
        url,
        ...datesGroupedGranularity,
      };

  const _urls = grouped
    ? {
        urls,
      }
    : { url };

  return {
    updateOne: {
      filter,
      update: {
        $setOnInsert: {
          _id: new Types.ObjectId(),
          ..._urls,
          ...datesGroupedGranularity,
        },
        $set: {
          ...metrics,
        },
      },
      upsert: true,
    },
  };
}

export function getStrategy(config: ReportConfig) {
  const { grouped, breakdownDimension } = config;

  if (grouped && breakdownDimension) {
    return groupedWithDimensionStrategy;
  }

  if (grouped && !breakdownDimension) {
    return groupedNoDimensionStrategy;
  }

  if (!grouped && breakdownDimension) {
    return ungroupedWithDimensionStrategy;
  }

  if (!grouped && !breakdownDimension) {
    return ungroupedNoDimensionStrategy;
  }

  throw new Error('Results processor not found');
}

export function processResults(
  config: ReportConfig,
  query: AAQueryConfig,
  dataPoints: ReportDataPoint[],
  results: AAResponseBody,
) {
  return getStrategy(config).toBulkInserts(dataPoints, query, results);
}

export interface QueryResultsProcessor<ParsedData> {
  parseQueryResults(query: AAQueryConfig, results: AAResponseBody): ParsedData;
  dataPointToMetrics(
    dataPoint: ReportDataPoint,
    parsedData: ParsedData,
  ): mongo.MatchKeysAndValues<CustomReportsMetrics>;
  toBulkInserts(
    dataPoints: ReportDataPoint[],
    query: AAQueryConfig,
    queryResults: AAResponseBody,
  ): mongo.AnyBulkWriteOperation<CustomReportsMetrics>[];
}

export const ungroupedNoDimensionStrategy: QueryResultsProcessor<
  Record<string, { [metricName: string]: number }>
> = {
  parseQueryResults(query, results) {
    const columnIds = results.columns.columnIds;
    const row = (results.summaryData?.['totals'] || []) as (number | string)[];

    if (!row.length) {
      throw new Error('No data found for grouped data point');
    }

    const resultsByUrl: Record<string, { [metricName: string]: number }> =
      Object.fromEntries(
        results.rows.map((row) => [
          row.value,
          Object.fromEntries(
            row.data
              // filter out "NaN"s
              .filter((value) => typeof value !== 'string')
              .map((value, index) => [
                columnIds[index] as AAMetricName,
                value as number,
              ]),
          ),
        ]),
      );

    return resultsByUrl;
  },
  dataPointToMetrics(dataPoint, resultsByUrl) {
    const { url, metrics: metricNames } = dataPoint;

    const associatedResults = url ? resultsByUrl[url.slice(-255)] : undefined;

    if (!associatedResults) {
      console.error('\nNo associated results found for url:');
      console.error(url);
      console.error('');
    }

    return Object.fromEntries(
      metricNames.map((metricName) => [
        `metrics.${metricName}`, // will need to adjust for breakdownDimension
        associatedResults?.[metricName] || undefined,
      ]),
    );
  },
  toBulkInserts(dataPoints, query, queryResults) {
    const parsedData = this.parseQueryResults(query, queryResults);

    return dataPoints.map((dataPoint) => {
      const metrics = this.dataPointToMetrics(dataPoint, parsedData);

      return dataPointToBulkInsert(dataPoint, metrics);
    });
  },
};

export const ungroupedWithDimensionStrategy: QueryResultsProcessor<
  Record<string, { [metricName: string]: number }>
> = {
  parseQueryResults(query, results) {
    const columnIds = results.columns.columnIds;

    const resultsByDimensionValue: Record<
      string,
      { [metricName: string]: number }
    > = Object.fromEntries(
      results.rows.map((row) => [
        row.value,
        Object.fromEntries(
          row.data
            // filter out "NaN"s
            .filter((value) => typeof value !== 'string')
            .map((value, index) => [
              columnIds[index] as AAMetricName,
              value as number,
            ]),
        ),
      ]),
    );

    return resultsByDimensionValue;
  },
  dataPointToMetrics(dataPoint, resultsByDimensionValue) {
    const { metrics: metricNames, breakdownDimension } = dataPoint;

    return Object.fromEntries(
      metricNames.flatMap((metricName) =>
        Object.keys(resultsByDimensionValue).map((dimensionValue) => [
          `metrics_by.${breakdownDimension}.${dimensionValue}.${metricName}`,
          resultsByDimensionValue[dimensionValue][metricName] || undefined,
        ]),
      ),
    );
  },
  toBulkInserts(dataPoints, query, queryResults) {
    const parsedData = this.parseQueryResults(query, queryResults);

    return dataPoints.map((dataPoint) => {
      const metrics = this.dataPointToMetrics(dataPoint, parsedData);

      return dataPointToBulkInsert(dataPoint, metrics);
    });
  },
};

export const groupedNoDimensionStrategy: QueryResultsProcessor<
  Record<string, number>
> = {
  parseQueryResults(query, results) {
    const columnIds = results.columns.columnIds;
    const row = (results.summaryData?.['totals'] || []) as (number | string)[];

    if (!row.length) {
      throw new Error('No data found for grouped data point');
    }

    return Object.fromEntries(
      row
        // filter out "NaN"s
        .filter((value) => typeof value !== 'string')
        .map((value, index) => [
          columnIds[index] as AAMetricName,
          value as number,
        ]),
    );
  },
  dataPointToMetrics(dataPoint, resultsByMetric) {
    const { metrics: metricNames } = dataPoint;

    return Object.fromEntries(
      metricNames.map((metricName) => [
        `metrics.${metricName}`,
        resultsByMetric[metricName] || undefined,
      ]),
    );
  },
  toBulkInserts(dataPoints, query, queryResults) {
    const parsedData = this.parseQueryResults(query, queryResults);

    return dataPoints.map((dataPoint) => {
      const metrics = this.dataPointToMetrics(dataPoint, parsedData);

      return dataPointToBulkInsert(dataPoint, metrics);
    });
  },
};

export const groupedWithDimensionStrategy: QueryResultsProcessor<
  Record<string, { [metricName: string]: number }>
> = {
  parseQueryResults(query, results) {
    const columnIds = results.columns.columnIds;

    const resultsByDimensionValue: Record<
      string,
      { [metricName: string]: number }
    > = Object.fromEntries(
      results.rows.map((row) => [
        row.value,
        Object.fromEntries(
          row.data
            // filter out "NaN"s
            .filter((value) => typeof value !== 'string')
            .map((value, index) => [
              columnIds[index] as AAMetricName,
              value as number,
            ]),
        ),
      ]),
    );

    return resultsByDimensionValue;
  },
  dataPointToMetrics: ungroupedWithDimensionStrategy.dataPointToMetrics,
  toBulkInserts(dataPoints, query, queryResults) {
    const parsedData = this.parseQueryResults(query, queryResults);

    return dataPoints.map((dataPoint) => {
      const metrics = this.dataPointToMetrics(dataPoint, parsedData);

      return dataPointToBulkInsert(dataPoint, metrics);
    });
  },
};
