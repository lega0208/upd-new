import { InjectFlowProducer, InjectQueue } from '@nestjs/bullmq';
import { type FlowChildJob, FlowProducer, Queue } from 'bullmq';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Types } from 'mongoose';
import type { FilterQuery } from 'mongoose';
import { omit } from 'rambdax';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import type {
  AADimensionName,
  AAMetricName,
  AAQueryConfig,
  ReportConfig,
} from '@dua-upd/types-common';
import { DbService, CustomReportsMetrics } from '@dua-upd/db';
import { CustomReportsCache } from './custom-reports.cache';
import { instanceId } from './custom-reports.module';
import { decomposeConfig } from './custom-reports.strategies';
import { hashConfig, hashQueryConfig } from './custom-reports.utils';
import {
  ChildJobStatus,
  ChildQueueEvents,
  ReportJobStatus,
  ReportsQueueEvents,
} from './custom-reports.listeners';

export type ChildJobMetadata = {
  hash: string;
  reportId: string;
  config: ReportConfig<Date>;
  query: AAQueryConfig;
  dataPoints: ReportDataPoint[];
};

@Injectable()
export class CustomReportsService implements OnApplicationBootstrap {
  // todo: cleanup observables
  observablesRegistry = new Map<string, Observable<ReportJobStatus>>();

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
    @Inject('INSTANCE_ID')
    private instanceId: string,
  ) {}

  async onApplicationBootstrap() {
    await this.reportsQueue.obliterate();
    await this.childJobsQueue.obliterate();
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

  // are these necessary? duplicate jobs are ignored
  async findExistingReportJobs(reportId: string) {
    return await this.reportsQueue.getJob(reportId);
  }

  async filterExistingChildJobs(childJobIds: string[]) {
    const existingJobs = (
      await this.childJobsQueue.getJobs([
        'active',
        'delayed',
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

    const config = (
      await this.db.collections.customReportsRegistry
        .findOne({ _id: new Types.ObjectId(reportId) })
        .lean()
        .exec()
    )?.config;

    if (!config) {
      throw Error('Report not found');
    }

    // decompose config into queries and data points and skip existing data points
    const queriesWithDataPoints = await this.filterExistingData(
      decomposeConfig(config),
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

    const reportStatus$ = this.getStatusObservable(reportId);

    if (reportStatus$) {
      return;
    }

    await this.createAndDispatchFlow(reportId, config, queriesWithDataPoints);

    return;
  }

  async createAndDispatchFlow(
    reportId: string,
    config: ReportConfig<Date>,
    queriesWithDataPoints: QueryWithDataPoints[],
  ): Promise<void> {
    const children: FlowChildJob[] = queriesWithDataPoints.map(
      (queryWithDataPoints): FlowChildJob => {
        const { query, dataPoints } = queryWithDataPoints;
        const hash = hashQueryConfig(query);

        return {
          name: hash,
          queueName: 'fetchAndProcessReportData',
          prefix: instanceId,
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
            backoff: {
              type: 'exponential',
              delay: 510,
            },
            removeOnComplete: {
              age: 1000 * 60 * 30, // 30 minutes
            },
            removeOnFail: {
              age: 1000 * 60 * 30, // 30 minutes
            },
            failParentOnFailure: true,
          },
        };
      },
    );

    await this.reportFlowProducer.add({
      name: reportId,
      queueName: 'prepareReportData',
      prefix: instanceId,
      data: {
        id: reportId,
        config,
        hash: hashConfig(config),
      },
      opts: {
        jobId: reportId,
        attempts: 3,
        removeOnComplete: {
          age: 1000 * 60 * 30, // 30 minutes
        },
        removeOnFail: {
          age: 1000 * 60 * 30, // 30 minutes
        },
        backoff: {
          type: 'fixed',
          delay: 2000,
        },
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
        const { metrics: metricsList, breakdownDimension } = dataPoint;

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

        const metrics = breakdownDimension
          ? record.metrics_by?.[breakdownDimension]
          : record.metrics;

        if (!metrics) {
          newDataPoints.push(dataPoint);
          continue;
        }

        const newDataPointMetrics: AAMetricName[] = [];

        for (const metric of metricsList) {
          // if breakdownDimension
          if (
            Array.isArray(metrics) &&
            !metrics.some((valueMetrics) => valueMetrics[metric])
          ) {
            newDataPointMetrics.push(metric);
            continue;
          }

          if (!(<typeof record.metrics>metrics)[metric]) {
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
