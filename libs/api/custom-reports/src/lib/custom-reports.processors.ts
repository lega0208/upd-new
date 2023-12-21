import { DbService } from '@dua-upd/db';
import { ReportConfig } from '@dua-upd/types-common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AdobeAnalyticsClient } from './clients/adobe-analytics.client';
import { createQuery } from './clients/adobe-analytics.query';
import {
  ChildJobMetadata,
  CustomReportsService,
} from './custom-reports.service';

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
  constructor(private db: DbService) {
    super();
  }

  async process(job: Job<ReportCreationMetadata, void, string>) {
    return await this.db.collections.customReportsMetrics.getReport(
      job.data.config,
    );
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

    const { reportId, config, query, dataPoints } = job.data;

    const strategy = this.reportsService.getStrategy(reportId, config);

    const queryResults = await this.aaClient.execute(createQuery(query));

    const bulkWriteOps = strategy.parseQueryResults(
      query,
      dataPoints,
      queryResults,
    );

    // todo: handle errors

    await this.db.collections.customReportsMetrics.bulkWrite(bulkWriteOps);

    return;
  }
}
