import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DbService,
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
  DateType,
  SearchAnalyticsClient,
  SearchAssessmentService,
  withRetry,
} from '@dua-upd/external-data';
import { BlobLogger } from '@dua-upd/logger';
import {
  AsyncLogTiming,
  dateRangeConfigs,
  prettyJson,
} from '@dua-upd/utils-common';
import { CalldriversService } from './airtable/calldrivers.service';
import { FeedbackService } from './airtable/feedback.service';
import { AirtableService } from './airtable/airtable.service';
import { OverallMetricsService } from './overall-metrics/overall-metrics.service';
import { PageUpdateService } from './pages/pages.service';
import { PageMetricsService } from './pages-metrics/page-metrics.service';
import { InternalSearchTermsService } from './internal-search/search-terms.service';
import { ActivityMapService } from './activity-map/activity-map.service';
import dayjs from 'dayjs';

@Injectable()
export class DbUpdateService {
  constructor(
    private db: DbService,
    @Inject('DB_UPDATE_LOGGER')
    private logger: BlobLogger,
    @Inject(SearchAnalyticsClient.name)
    private gscClient: SearchAnalyticsClient,
    private airtableService: AirtableService,
    private calldriversService: CalldriversService,
    private feedbackService: FeedbackService,
    private overallMetricsService: OverallMetricsService,
    private pagesService: PageUpdateService,
    private pageMetricsService: PageMetricsService,
    private internalSearchService: InternalSearchTermsService,
    private activityMapService: ActivityMapService,
    private searchAssessmentService: SearchAssessmentService,
    @InjectModel(Overall.name, 'defaultConnection')
    private overallMetricsModel: Model<OverallDocument>,
    @InjectModel(Page.name, 'defaultConnection')
    private pageModel: Model<PageDocument>,
    @InjectModel(PageMetrics.name, 'defaultConnection')
    private pageMetricsModel: PageMetricsModel,
    @InjectModel(PagesList.name, 'defaultConnection')
    private pagesListModel: Model<PagesListDocument>
  ) {
    this.logger.setContext('DbUpdater');
  }

  async updateSAT() {
    this.logger.log('Starting search assessment...');
    await this.searchAssessmentService.upsertPreviousSearchAssessment();
    await this.searchAssessmentService.getLatestSearchAssessment();
    this.logger.log('Search assessment successfully updated.');
  }

  async updateActivityMap() {
    this.logger.log('Starting activity map...');
    await this.activityMapService.upsertPageActivityMap();
    this.logger.log('Activity map successfully updated.');
  }

  async updateAll(logToBlobs = false) {
    if (logToBlobs) {
      const date = dayjs().format('YYYY-MM-DD');
      const month = dayjs().format('YYYY-MM');

      this.logger.setLogLevelTargets({
        error: `${month}/db-update_errors_${date}`,
        warn: `${month}/db-update_${date}`,
        log: `${month}/db-update-${date}`,
      });
    }

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
          this.logger.error(`Error updating overall metrics\n${err.stack}`)
        ),
        withRetry(this.updateUxData.bind(this), 4, 1000)().catch((err) =>
          this.logger.error(`Error updating UX data\n${err.stack}`)
        ),
      ]);

      await withRetry(this.updateFeedback.bind(this), 4, 1000)().catch((err) =>
        this.logger.error(`Error updating Feedback data\n${err.stack}`)
      );

      await Promise.allSettled([
        withRetry(
          this.calldriversService.updateCalldrivers.bind(
            this.calldriversService
          ),
          4,
          1000
        )().catch((err) =>
          this.logger.error(`Error updating Calldrivers data\n${err.stack}`)
        ),
        // withRetry(this.pagesService.updatePages.bind(this.pagesService), 4, 1000)().catch((err) =>
        //   this.logger.error('Error updating Page data', err)
        // ),
      ]);

      await this.pagesService.consolidateDuplicatePages();

      await this.internalSearchService
        .upsertOverallSearchTerms()
        .catch((err) => this.logger.error(err.stack));

      await Promise.allSettled([
        await this.pageMetricsService
          .updatePageMetrics()
          .catch((err) =>
            this.logger.error(`Error updating Page metrics data\n${err.stack}`)
          ),
        await this.airtableService.uploadProjectAttachmentsAndUpdateUrls(),
      ]);

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

  async consolidateDuplicatePages() {
    return await this.pagesService.consolidateDuplicatePages();
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

  async recalculateViews(logToBlobs = false) {
    if (logToBlobs) {
      const date = dayjs().format('YYYY-MM-DD');
      const month = dayjs().format('YYYY-MM');

      this.logger.setLogLevelTargets({
        error: `${month}/db-update_errors_${date}`,
        warn: `${month}/db-update_${date}`,
        log: `${month}/db-update-${date}`,
      });
    }

    const dateRanges = dateRangeConfigs
      .map((config) => {
        const dateRange = config.getDateRange();
        const comparisonDateRange = {
          start: config.getComparisonDate(dateRange.start),
          end: config.getComparisonDate(dateRange.end),
        };

        return [
          {
            start: dateRange.start.format('YYYY-MM-DD'),
            end: dateRange.end.format('YYYY-MM-DD'),
          },
          {
            start: comparisonDateRange.start.format('YYYY-MM-DD'),
            end: comparisonDateRange.end.format('YYYY-MM-DD'),
          },
        ];
      })
      .flat();

    const pageVisits = this.db.views.pageVisits;

    try {
      for (const dateRange of dateRanges) {
        this.logger.info(
          'Recalculating page visits view for dateRange: ',
          JSON.stringify(dateRange, null, 2)
        );

        const result = await pageVisits.getOrUpdate(dateRange, true);

        if (!result?.pageVisits?.length) {
          this.logger.error(
            'Recalculation failed or contains no results for dateRange: ' +
              prettyJson(dateRange)
          );

          continue;
        }

        this.logger.info('Date range successfully recalculated.');
      }
    } catch (err) {
      this.logger.error(err.stack);
    }
  }
}
