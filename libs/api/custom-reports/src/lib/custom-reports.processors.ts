import { DbService } from '@dua-upd/db';
import { ReportConfig } from '@dua-upd/types-common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AdobeAnalyticsClient } from './clients/adobe-analytics.client';
import { createQuery } from './clients/adobe-analytics.query';
import { CustomReportsCache } from './custom-reports.cache';
import {
  ChildJobMetadata,
  CustomReportsService,
} from './custom-reports.service';
import { processResults } from './custom-reports.strategies';

type ReportCreationMetadata = {
  id: string;
  config: ReportConfig;
  hash: string;
};

/**
 * Top-level processor for the `prepareReportData` queue.
 * This processor has as dependencies all sub-tasks needed
 * to prepare the data for the report.
 */
@Processor('prepareReportData')
export class PrepareReportDataProcessor extends WorkerHost {
  constructor(
    private db: DbService,
    private cache: CustomReportsCache,
  ) {
    super();
  }

  async process(job: Job<ReportCreationMetadata, void, string>) {
    try {
      const report = await this.db.collections.customReportsMetrics.getReport(
        job.data.config,
      );

      if (report.length) {
        await this.cache.setReport(job.data.id, report);
      }

      return report;
    } catch (err) {
      console.error('jobId: ', job.id);
      console.error((<Error>err).stack);
      throw err;
    }
  }
}

/**
 * Sub-level processor for the `fetchAndProcessReportData` queue.
 * Fetches and parses data from a datasource, and writes it to the db.
 */
@Processor('fetchAndProcessReportData')
export class FetchAndProcessDataProcessor extends WorkerHost {
  constructor(
    private reportsService: CustomReportsService,
    private aaClient: AdobeAnalyticsClient,
    private db: DbService,
  ) {
    super();
  }

  async process(job: Job<ChildJobMetadata, void, string>) {
    // check if data already exists, otherwise fetch it

    const { config, query, dataPoints } = job.data;

    const queryResults = await this.aaClient.execute(createQuery(query));

    const bulkWriteOps = processResults(
      config,
      query,
      dataPoints,
      queryResults,
    );

    // todo: handle errors

    await this.db.collections.customReportsMetrics.bulkWrite(bulkWriteOps);

    return;
  }
}
