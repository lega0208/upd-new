import { type AAResponseBody, queryDateFormat } from '@dua-upd/external-data';
import { dateRangeSplit, dateRangeToGranularity } from '@dua-upd/utils-common';
import { InjectFlowProducer, InjectQueue } from '@nestjs/bullmq';
import { type FlowChildJob, FlowProducer, Queue } from 'bullmq';

import type {
  PageDocument,
  ProjectDocument,
  TaskDocument,
} from '@dua-upd/db';
import {
  DbService,
  Page,
  Project,
  Task,
  CustomReportsMetrics,
} from '@dua-upd/db';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import type { Document, FilterQuery,  mongo } from 'mongoose';
import { omit } from 'rambdax';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import type {
  AADimensionName,
  AAMetricName,
  AAQueryConfig,
  AAQueryDateRange,
  PagesHomeData,
  ReportConfig,
  ReportStatus,
} from '@dua-upd/types-common';
import { CustomReportsCache } from './custom-reports.cache';
import {
  ChildJobStatus,
  ChildQueueEvents,
  ReportJobStatus,
  ReportsQueueEvents,
} from './custom-reports.listeners';
import { hashConfig, hashQueryConfig } from './custom-reports.utils';
import { InjectModel } from '@nestjs/mongoose';

export type ChildJobMetadata = {
  hash: string;
  reportId: string;
  config: ReportConfig;
  query: AAQueryConfig;
  dataPoints: ReportDataPoint[];
};

interface BaseDocument {
  _id: string;  // Adjust the type as necessary
  title: string;
  pages?: Types.ObjectId[] | Page[] | undefined;
}

@Injectable()
export class CustomReportsService {
  // for reusing strategies instead of re-creating them every time
  strategyRegistry = new Map<string, CustomReportsStrategy>();
  // todo: cleanup observables
  observablesRegistry = new Map<string, Observable<ReportStatus>>();

  constructor(
    private db: DbService,
    @InjectFlowProducer('reportFlow')
    private reportFlowProducer: FlowProducer,
    @InjectQueue('prepareReportData')
    private reportsQueue: Queue,
    @InjectQueue('fetchAndProcessReportData')
    private childJobsQueue: Queue,
    private reportQueueEvents: ReportsQueueEvents,
    private childQueueEvents: ChildQueueEvents,
    private cache: CustomReportsCache,
    @InjectModel(Page.name, 'defaultConnection')
    private pageModel: Model<Page>,
    @InjectModel(Task.name, 'defaultConnection')
    private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name, 'defaultConnection')
    private projectModel: Model<ProjectDocument>,
  ) {}

  async getCustomReportData(): Promise<PagesHomeData> {

    const dateRange = '2022-01-01/2022-01-31';

    const [startDate, endDate] = dateRangeSplit(dateRange);
    const queryDateRange = {
      start: startDate,
      end: endDate,
    };

    const pageList = await this.db.views.pageVisits.getVisitsWithPageData(
      queryDateRange,
      this.pageModel,
    );

const extractUrls = (pages: Types.ObjectId[] | Page[] | undefined) => {
  if (!pages) {
    return null;
  }
  
  return pages
    .map(page => 'url' in page ? page.url : null)
    .filter(url => url != null);
};

const getData = async <T extends BaseDocument>(model: Model<T>) => {
  const items = await model.find().populate(['pages']).exec();
  return items.map((item) => ({
    _id: item._id,
    title: item.title,
    urls: extractUrls(item.pages)
  }));
};

const taskData = await getData<TaskDocument>(this.taskModel);
const projectData = await getData<ProjectDocument>(this.projectModel);

const results: PagesHomeData = {
  dateRange,
  taskList: taskData,
  projectList: projectData,
  dateRangeData: pageList,
};

return results;
  }

  getStrategy(reportId: string, config: ReportConfig) {
    if (!this.strategyRegistry.has(reportId)) {
      this.strategyRegistry.set(reportId, createReportStrategy(config));
    }

    return this.strategyRegistry.get(reportId) as CustomReportsStrategy;
  }

  async getReportObservable(reportId: string, childJobIds: string[]) {
    const childJobStatuses = Object.fromEntries(
      childJobIds.map((id) => [
        id,
        {
          jobId: id,
          status: 'pending',
        } as ChildJobStatus,
      ]),
    );

    const childJobEvents$ =
      this.childQueueEvents.getReportChildrenObservable(childJobIds);

    const childJobProgress$ = childJobEvents$.pipe(
      map((event) => {
        childJobStatuses[event.jobId] = event;

        const completedChildJobs = Object.entries(childJobStatuses).filter(
          ([, job]) => job.status === 'complete',
        ).length;

        const totalChildJobs = Object.keys(childJobStatuses).length;

        return {
          completedChildJobs,
          totalChildJobs,
        };
      }),
    );

    const reportEvents$ = this.reportQueueEvents
      .getReportObservable(reportId)
      .pipe(
        startWith({
          status: 'pending',
          completedChildJobs: 0,
          totalChildJobs: childJobIds.length,
        } as ReportJobStatus),
      );

    return combineLatest([reportEvents$, childJobProgress$]).pipe(
      map(([reportStatus, childJobProgress]) => ({
        ...reportStatus,
        ...childJobProgress,
      })),
    );
  }

  getStatusObservable(reportId: string) {
    return this.observablesRegistry.get(reportId);
  }

  async findExistingReportJobs(reportId: string) {
    return await this.reportsQueue.getJob(reportId);
  }

  async filterExistingChildJobs(childJobIds: string[]) {
    const existingJobs = (
      await this.childJobsQueue.getJobs([
        'active',
        'delayed',
        'completed',
        'paused',
        'wait',
        'waiting',
      ])
    ).map((job) => job.id);

    const existingJobsSet = new Set(existingJobs);

    return childJobIds.filter((id) => !existingJobsSet.has(id));
  }

  async create(config: ReportConfig): Promise<string> {
    // check if report already exists
    const configHash = hashConfig(config);

    const existingReport = await this.db.collections.customReportsRegistry
      .findOne({
        configHash,
      })
      .lean()
      .exec();

    if (existingReport) {
      return existingReport._id.toString();
    }

    // if it doesn't exist, create it
    const _id = new Types.ObjectId();

    await this.db.collections.customReportsRegistry.create({
      _id,
      config,
      configHash,
    });

    return _id.toString();
  }

  async fetchOrPrepareReport(reportId: string) {
    // check if report exists in cache
    const cachedReport = await this.cache.getReport(reportId);

    if (cachedReport) {
      console.log('got cached report');
      return cachedReport;
    }

    // todo: implement config caching?
    const config = (
      await this.db.collections.customReportsRegistry
        .findOne({ _id: new Types.ObjectId(reportId) })
        .lean()
        .exec()
    )?.config;

    if (!config) {
      throw Error('Report not found');
    }

    // todo: "hard-code"/pre-define strategies
    const strategy = this.getStrategy(reportId, config);

    // decompose config into queries and data points and skip existing data points
    const queriesWithDataPoints = await this.filterExistingData(
      strategy.decomposeConfig(config),
    );

    // logJson(queriesWithDataPoints);

    // if queriesWithDataPoints is empty, we already have all the data
    // so we can assemble the report and return it
    if (!queriesWithDataPoints.length) {
      console.log('already have all data - assembling report');
      const report =
        await this.db.collections.customReportsMetrics.getReport(config);

      // cache the report
      await this.cache.setReport(reportId, report);

      return report;
    }

    await this.createAndDispatchFlow(reportId, config, queriesWithDataPoints);

    return;
  }

  async createAndDispatchFlow(
    reportId: string,
    config: ReportConfig,
    queriesWithDataPoints: QueryWithDataPoints[],
  ): Promise<void> {
    // todo: check for running jobs? duplicates are ignored so might not be necessary

    const children: FlowChildJob[] = queriesWithDataPoints.map(
      (queryWithDataPoints) => {
        const { query, dataPoints } = queryWithDataPoints;
        const hash = hashQueryConfig(query);

        return {
          name: hash,
          queueName: 'fetchAndProcessReportData',
          data: {
            hash,
            reportId,
            config,
            query,
            dataPoints,
          } as ChildJobMetadata,
          opts: {
            jobId: hash,
            attempts: 3,
            removeOnComplete: true,
            removeOnFail: true,
          },
        };
      },
    );

    await this.reportFlowProducer.add({
      name: reportId,
      queueName: 'prepareReportData',
      data: {
        id: reportId,
        config,
        hash: hashConfig(config),
      },
      opts: {
        jobId: reportId,
        removeOnComplete: true,
        attempts: 3,
        removeOnFail: true,
      },
      children,
    });

    const reportStatus$ = await this.getReportObservable(
      reportId,
      children.map((child) => child.data.hash),
    );

    // just top-level for now, will derive a better status later
    this.observablesRegistry.set(reportId, reportStatus$);
  }

  async filterExistingData(queriesWithDataPoints: QueryWithDataPoints[]) {
    // rebuild the `queriesWithDataPoints` array, including only the data points
    //  that don't already exist in the db
    const newQueriesWithDataPoints: QueryWithDataPoints[] = [];

    for (const queryWithDataPoints of queriesWithDataPoints) {
      const { dataPoints } = queryWithDataPoints;

      const newDataPoints: ReportDataPoint[] = [];

      for (const dataPoint of dataPoints) {
        const { metrics, breakdownDimension } = dataPoint;

        const query: FilterQuery<CustomReportsMetrics> = omit(
          [
            'metrics',
            'metrics_by',
            ...(dataPoint.granularity === 'day' ? ['endDate'] : []),
          ],
          dataPoint,
        );

        const record = await this.db.collections.customReportsMetrics
          .findOne(query)
          .lean()
          .exec();

        if (!record) {
          newDataPoints.push(dataPoint);
          continue;
        }

        const metricsObject = breakdownDimension
          ? record.metrics_by?.[breakdownDimension]
          : record.metrics;

        if (!metricsObject) {
          newDataPoints.push(dataPoint);
          continue;
        }

        const newDataPointMetrics: AAMetricName[] = [];

        for (const metric of metrics) {
          if (!metricsObject[metric]) {
            newDataPointMetrics.push(metric);
          }
        }

        if (newDataPointMetrics.length) {
          newDataPoints.push({
            ...dataPoint,
            metrics: newDataPointMetrics,
          });
        }
      }

      if (newDataPoints.length) {
        newQueriesWithDataPoints.push({
          ...queryWithDataPoints,
          dataPoints: newDataPoints,
        });
      }
    }

    return newQueriesWithDataPoints;
  }
}

export type ReportDataPoint = Omit<
  CustomReportsMetrics,
  '_id' | 'metrics' | 'metrics_by'
> & {
  metrics: AAMetricName[];
  breakdownDimension?: AADimensionName;
};

export type QueryWithDataPoints = {
  query: AAQueryConfig;
  dataPoints: ReportDataPoint[];
};

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

// may very well be unnecessary
/**
 * A strategy to define the logic for each step of the pipeline,
 *  to be selected based on the report config.
 */
export interface CustomReportsStrategy {
  /**
   * Decompose the report config into a list queries for granular data, along with
   * a list of the individual data points to be inserted (to be used for tracking/reuse).
   * @param config The report config.
   */
  decomposeConfig(config: ReportConfig): QueryWithDataPoints[];

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

export function createReportStrategy(config: ReportConfig) {
  const { dateRange, granularity, grouped, metrics, urls, breakdownDimension } =
    config;

  if (!grouped && !breakdownDimension) {
    const strategy: CustomReportsStrategy = {
      decomposeConfig() {
        const dateRanges =
          granularity === 'none'
            ? [dateRange]
            : dateRangeToGranularity(dateRange, granularity, queryDateFormat);

        const queries: AAQueryConfig[] = dateRanges.map((dateRange) => ({
          dateRange: dateRange as AAQueryDateRange,
          metricNames: metrics as AAMetricName[],
          dimensionName: 'url_last_255',
          urls,
        }));

        return queries.map((query) => ({
          query,
          dataPoints: deriveDataPoints(config, query),
        }));
      },
      parseQueryResults(
        query: AAQueryConfig,
        dataPoints: ReportDataPoint[],
        results: AAResponseBody,
      ) {
        const startDate = new Date(query.dateRange.start);
        const endDate = new Date(query.dateRange.end);
        const columnIds = results.columns.columnIds;
        const rows = results.rows;

        // this logic will only work for non-grouped + no breakdownDimension
        // may need to add dates to the key if query involves multiple dates
        const resultsByUrl: Record<string, { [metricName: string]: number }> =
          Object.fromEntries(
            rows.map((row) => [
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

        const dates =
          config.granularity === 'day'
            ? {
                startDate,
              }
            : {
                startDate,
                endDate,
              };

        return dataPoints.map((dataPoint) => {
          const { url, metrics: metricNames, grouped, granularity } = dataPoint;

          const associatedResults = url ? resultsByUrl[url] : undefined;

          if (!associatedResults) {
            console.error('\nNo associated results found for url:');
            console.error(url);
            console.error('');
          }

          const metrics = Object.fromEntries(
            metricNames.map((metricName) => [
              `metrics.${metricName}`, // will need to adjust for breakdownDimension
              associatedResults?.[metricName] || undefined,
            ]),
          );

          return {
            updateOne: {
              filter: {
                url,
                ...dates,
                grouped,
                granularity,
              },
              update: {
                $setOnInsert: {
                  _id: new Types.ObjectId(),
                  url,
                  ...dates,
                  grouped,
                  granularity,
                },
                $set: {
                  ...metrics,
                },
              },
              upsert: true,
            },
          } as mongo.AnyBulkWriteOperation<CustomReportsMetrics>;
        });
      },
    };

    return strategy;
  }

  throw Error('Not implemented');
}
