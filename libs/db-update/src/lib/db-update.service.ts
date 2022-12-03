import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Overall,
  Page,
  PageMetrics,
  PagesList,
  PagesListDocument,
} from '@dua-upd/db';
import type {
  OverallDocument,
  PageDocument,
  PageMetricsModel,
} from '@dua-upd/db';
import {
  DateRange,
  DateType,
  queryDateFormat,
  SearchAnalyticsClient,
  SearchAssessmentService,
  withRetry,
} from '@dua-upd/external-data';
import { AsyncLogTiming, wait } from '@dua-upd/utils-common';
import { CalldriversService } from './airtable/calldrivers.service';
import { FeedbackService } from './airtable/feedback.service';
import { AirtableService } from './airtable/airtable.service';
import { OverallMetricsService } from './overall-metrics/overall-metrics.service';
import { PageUpdateService } from './pages/pages.service';
import { PageMetricsService } from './pages-metrics/page-metrics.service';
import { InternalSearchTermsService } from './internal-search/search-terms.service';

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
    private internalSearchService: InternalSearchTermsService,
    private searchAssessmentService: SearchAssessmentService,
    @InjectModel(Overall.name, 'defaultConnection')
    private overallMetricsModel: Model<OverallDocument>,
    @InjectModel(Page.name, 'defaultConnection')
    private pageModel: Model<PageDocument>,
    @InjectModel(PageMetrics.name, 'defaultConnection')
    private pageMetricsModel: PageMetricsModel,
    @InjectModel(PagesList.name, 'defaultConnection')
    private pagesListModel: Model<PagesListDocument>
  ) {}

  async updateSAT() {
    this.logger.log('Starting search assessment...');
    await this.searchAssessmentService.upsertPreviousSearchAssessment();
    await this.searchAssessmentService.getLatestSearchAssessment();
    this.logger.log('Search assessment successfully updated.');
  }

  async updateAll() {
    this.logger.log('Starting database updates...');

    try {
      // Make sure not to run updates for the same data sources at
      //  the same time, or else we'll hit the rate limit

      await this.airtableService.updatePagesList();
      this.logger.log('Published Pages list successfully updated');

      await Promise.allSettled([
        withRetry(
          this.overallMetricsService.updateOverallMetrics.bind(
            this.overallMetricsService
          ),
          4,
          1000
        )().catch((err) =>
          this.logger.error('Error updating overall metrics', err.stack)
        ),
        withRetry(this.updateUxData.bind(this), 4, 1000)().catch((err) =>
          this.logger.error('Error updating UX data', err.stack)
        ),
      ]);

      await withRetry(this.updateFeedback.bind(this), 4, 1000)().catch((err) =>
        this.logger.error('Error updating Feedback data', err.stack)
      );

      await Promise.allSettled([
        withRetry(
          this.calldriversService.updateCalldrivers.bind(
            this.calldriversService
          ),
          4,
          1000
        )().catch((err) =>
          this.logger.error('Error updating Calldrivers data', err.stack)
        ),
        // withRetry(this.pagesService.updatePages.bind(this.pagesService), 4, 1000)().catch((err) =>
        //   this.logger.error('Error updating Page data', err)
        // ),
      ]);

      await this.pagesService.consolidateDuplicatePages();

      await this.internalSearchService
        .upsertOverallSearchTerms()
        .catch((err) => this.logger.error(err.stack));

      await this.pageMetricsService.updatePageMetrics().catch((err) =>
        this.logger.error('Error updating Page Metrics data', err)
      );

      await this.internalSearchService
        .upsertPageSearchTerms()
        .catch((err) => this.logger.error(err.stack));

      await this.createPagesFromPageList();

      // run this again in case we've created duplicates from the published pages list
      await this.pagesService.consolidateDuplicatePages();

      this.logger.log('Database updates completed.');
    } catch (error) {
      this.logger.error(error);
      this.logger.error(error.stack);
    }
  }

  @AsyncLogTiming
  async createPagesFromPageList() {
    this.logger.log(`Checking for new pages in Published Pages list...`);
    const pagesList = (await this.pagesListModel.find().exec()) ?? [];
    const pagesListUrls = pagesList.map((page) => page.url);

    if (pagesList.length === 0) {
      throw new Error('Published pages list is empty');
    }

    const pagesWithListMatches =
      (await this.pageModel
        .find({
          all_urls: {
            $elemMatch: { $in: pagesListUrls },
          },
        })
        .exec()) ?? [];

    const urlsAlreadyInCollection = pagesWithListMatches.flatMap(
      (page) => page.all_urls
    );

    const pagesToCreate = pagesList
      .filter((page) => !urlsAlreadyInCollection.includes(page.url))
      .map((page) => ({
        _id: new Types.ObjectId(),
        url: page.url,
        title: page.title,
        all_urls: [page.url],
      }));

    this.logger.log(
      `Creating ${pagesToCreate.length} new pages from Published Pages list`
    );

    return this.pageModel.insertMany(pagesToCreate, { ordered: false });
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

  async upsertPageMetrics(pageMetrics: PageMetrics[]) {
    const bulkInsertOps = [];

    for (const pageMetric of pageMetrics) {
      const pageMetricNoId = { ...pageMetric };
      const _id = pageMetricNoId._id;
      delete pageMetricNoId._id;

      bulkInsertOps.push({
        updateOne: {
          filter: {
            url: pageMetric.url,
            date: pageMetric.date,
          },
          update: {
            $setOnInsert: {
              _id,
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
          upsert: true,
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
