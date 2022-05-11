import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Overall,
  OverallDocument,
  Page,
  PageMetrics,
} from '@cra-arc/types-common';
import type { PageDocument, PageMetricsModel } from '@cra-arc/types-common';
import {
  DateType,
  queryDateFormat,
  SearchAnalyticsClient,
  withRetry,
} from '@cra-arc/external-data';
import { wait } from '@cra-arc/utils-common';
import { CalldriversService } from './airtable/calldrivers.service';
import { FeedbackService } from './airtable/feedback.service';
import { AirtableService } from './airtable/airtable.service';
import { OverallMetricsService } from './overall-metrics/overall-metrics.service';
import { PageUpdateService } from './pages/pages.service';
import { PageMetricsService } from './pages-metrics/page-metrics.service';

dayjs.extend(utc);

@Injectable()
export class DbUpdateService {
  constructor(
    @Inject(SearchAnalyticsClient.name)
    private gscClient: SearchAnalyticsClient,
    private logger: ConsoleLogger,
    private airtableService: AirtableService,
    private calldriversService: CalldriversService,
    private feedbackService: FeedbackService,
    private overallMetricsService: OverallMetricsService,
    private pagesService: PageUpdateService,
    private pageMetricsService: PageMetricsService,
    @InjectModel(Overall.name)
    private overallMetricsModel: Model<OverallDocument>,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel
  ) {}

  async updateAll() {
    this.logger.log('Starting database updates...');

    try {
      // Make sure not to run updates for the same data sources at
      //  the same time, or else we'll hit the rate limit
      await Promise.allSettled([
        withRetry(
          this.overallMetricsService.updateOverallMetrics.bind(this.overallMetricsService),
          4,
          1000
        )().catch((err) =>
          this.logger.error('Error updating overall metrics', err)
        ),
        withRetry(this.updateUxData.bind(this), 4, 1000)().catch((err) =>
          this.logger.error('Error updating UX data', err)
        ),
      ]);

      await withRetry(this.updateFeedback.bind(this), 4, 1000)().catch(
        (err) => this.logger.error('Error updating Feedback data', err)
      );

      await Promise.allSettled([
        withRetry(this.calldriversService.updateCalldrivers.bind(this.calldriversService), 4, 1000)().catch(
          (err) => this.logger.error('Error updating Calldrivers data', err)
        ),
        withRetry(this.pagesService.updatePages.bind(this.pagesService), 4, 1000)().catch((err) =>
          this.logger.error('Error updating Page data', err)
        ),
      ]);

      await this.pagesService.consolidateDuplicatePages();

      await withRetry(
        this.pageMetricsService.updatePageMetrics.bind(this.pageMetricsService),
        4,
        1000
      )().catch((err) =>
        this.logger.error('Error updating Page Metrics data', err)
      );

      await this.pageMetricsService.addRefsToPageMetrics();

      this.logger.log('Database updates completed.');
    } catch (error) {
      this.logger.error(error);
    }
  }

  async updateUxData() {
    return this.airtableService.updateUxData();
  }

  async updateCalldrivers(endDate?: DateType) {
    return this.calldriversService.updateCalldrivers(endDate);
  }

  async updateFeedback(endDate?: DateType) {
    return this.feedbackService.updateFeedbackData(endDate);
  }

  async getSingleDayMetrics(date: string) {
    const dateRange = {
      start: dayjs(date).utc(false).startOf('day').format(queryDateFormat),
      end: dayjs.utc(date).add(1, 'day').format(queryDateFormat),
    };
    this.logger.log(
      `Getting metrics for ${dateRange.start} to ${dateRange.end}`
    );

    return (await this.pageMetricsService.fetchAndMergePageMetrics(dateRange)) as PageMetrics[];
  }

  async getPageMetrics(dates: string[]): Promise<PageMetrics[]> {
    const promises = [];

    for (const date of dates) {
      promises.push(this.getSingleDayMetrics(date));
      await wait(501);
    }

    return (await Promise.all(promises)).flat();
  }

  async upsertPageMetrics(pageMetrics: PageMetrics[]) {
    const bulkInsertOps = [];

    for (const pageMetric of pageMetrics) {
      const pageMetricNoId = { ...pageMetric };
      delete pageMetricNoId._id;

      bulkInsertOps.push({
        updateOne: {
          filter: {
            url: pageMetric.url,
            date: pageMetric.date,
          },
          update: {
            $setOnInsert: {
              _id: pageMetric._id,
            },
            $set: pageMetricNoId,
          },
          upsert: true,
        },
      });
    }

    return this.pageMetricsModel.bulkWrite(bulkInsertOps);
  }

  async upsertOverallGscMetrics(dates: Date[]) {
    const bulkInsertOps = [];

    const results = (
      await Promise.all(
        dates.map((date) => this.gscClient.getOverallMetrics(date))
      )
    ).flat();

    for (const result of results) {
      bulkInsertOps.push({
        updateOne: {
          filter: {
            date: result.date,
          },
          update: {
            $set: result,
          },
        },
      });
    }

    return this.overallMetricsModel.bulkWrite(bulkInsertOps);
  }

  async upsertGscPageMetrics(dates: Date[]) {
    const bulkInsertOps = [];

    const results = (
      await Promise.all(
        dates.map((date) => this.gscClient.getPageMetrics(date))
      )
    ).flat(2);

    for (const result of results) {
      bulkInsertOps.push({
        updateOne: {
          filter: {
            url: result.url,
            date: result.date,
          },
          update: {
            $set: result,
          },
        },
      });
    }

    return this.pageMetricsModel.bulkWrite(bulkInsertOps, { ordered: false });
  }

  async repopulateFeedback() {
    return await this.feedbackService.repopulateFeedback();
  }
}
