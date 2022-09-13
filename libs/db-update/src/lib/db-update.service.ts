import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Overall,
  Page,
  PageMetrics, PagesList, PagesListDocument
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
  withRetry
} from '@dua-upd/external-data';
import { wait } from '@dua-upd/utils-common';
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
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @InjectModel(PagesList.name) private pagesListModel: Model<PagesListDocument>,
  ) {}

  async updateAll() {
    this.logger.log('Starting database updates...');

    try {
      // Make sure not to run updates for the same data sources at
      //  the same time, or else we'll hit the rate limit

      await this.airtableService.updatePagesList();
      this.logger.log('Published Pages list successfully updated');

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
        // withRetry(this.pagesService.updatePages.bind(this.pagesService), 4, 1000)().catch((err) =>
        //   this.logger.error('Error updating Page data', err)
        // ),
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

      await this.createPagesFromPageList();

      this.logger.log('Database updates completed.');
    } catch (error) {
      this.logger.error(error);
      this.logger.error(error.stack);
    }
  }

  async createPagesFromPageList() {
    this.logger.log(`Checking for new pages in Published Pages list...`);
    const pagesList = (await this.pagesListModel.find().exec()) ?? [];
    const pagesListUrls = pagesList.map((page) => page.url);

    if (pagesList.length === 0) {
      throw new Error('Published pages list is empty');
    }

    const pagesWithListMatches = (await this.pageModel
      .find({
        all_urls: {
          $elemMatch: { $in: pagesListUrls },
        },
      })
      .exec()) ?? [];

    const urlsAlreadyInCollection = pagesWithListMatches.flatMap((page) => page.all_urls);

    const pagesToCreate = pagesList.filter((page) => !urlsAlreadyInCollection.includes(page.url)).map((page) => ({
      _id: new Types.ObjectId(),
      url: page.url,
      title: page.title,
      all_urls: [page.url],
    }));

    this.logger.log(`Creating ${pagesToCreate.length} new pages from Published Pages list`);

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

  async getSingleDayMetrics(date: string) {
    const dateRange = {
      start: dayjs.utc(date).startOf('day').format(queryDateFormat),
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

  // implement for pages & overall (w/ abstract class, inheritance, or interface?):
  //  -populate (figures out which DbPopulationStrategy to use),
  //    -populateBackwards,
  //    -populateForwards,
  //    -populateFromEmpty (backwards from yesterday),
  //    -"expand"(?) (backwards + forwards)
  //    -"fill" (probably later?) (fills holes in existing data)
  //  -"unify" in the below function, and add "populate" option to cli
  async populateDb(dateRange: DateRange) {
    return;
  }

  async populateBackwards(startDate: string) {
    if (/\d{4}-\d{2}-\d{2}/.test(startDate)) {
      throw new Error('startDate has incorrect format: expected YYYY-MM-DD')
    }

    // Overall metrics

    // get dates required for query
    const earliestDateResults = await this.overallMetricsModel
      .findOne({}, { date: 1 })
      .sort({ date: 1 })
      .exec();

    // get the earliest date from the DB, and set the end date to the previous day
    const earliestDate = dayjs.utc(earliestDateResults[0]['date']);
    const endDate = earliestDate.subtract(1, 'day').endOf('day');

    const dateRange: DateRange = {
      start: dayjs.utc(startDate).format(queryDateFormat),
      end: endDate.format(queryDateFormat),
    }
  }
}
