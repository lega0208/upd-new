import { ConsoleLogger, Injectable, Logger } from '@nestjs/common';
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
import { DbUpdateService } from '@cra-arc/db-update';
import { outputCsv } from './utils';

dayjs.extend(utc);

/*
 * Things to address:
 *  - Clean up Pages + Page Metrics with invalid URLs (will reduce overhead and db size)
 *  - Fill in missing data for what's currently there (but prioritizes most "important" pages -- top N by visits?)
 *  - Iterate through Pages and add refs to Page Metrics
 *  - Make db-updater handle errors better (on hitting rate-limit, save current "progress", wait 10 seconds, then try again)
 *    - Also, get titles and redirects at the same time so that it takes half as long and has less chance of hitting rate-limit
 *
 * Other stuff (later):
 *  - Add Tasks/Projects name translation fields to schemas & updater
 *  - Add Status to Projects on insertion, will make queries WAY simpler (and also easier to implement and change the logic
 *    - Could also derive most fields and make all queries simpler
 *  - Duplicate URLs in Pages
 *  - URLs starting with "http://" or "https://"
 *
 * Other other stuff:
 *  - db-updater docker container
 */
@Injectable()
export class DataIntegrityService {
  constructor(
    @InjectModel(Overall.name) private overallModel: Model<OverallDocument>,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    private dbUpdateService: DbUpdateService,
    private readonly logger: ConsoleLogger,
  ) {}

  // todo: implement this
  async purgeInvalidPageMetrics(dryRun = true) {
    // Set up query to find all documents with invalid urls

    if (dryRun) {
      return this.pageMetricsModel.find({
        url: { $exists: false },
      });
    }

    return this.pageMetricsModel.deleteMany({ url: { $exists: false } });
  }

  async findMissingMetrics() {
    return []; // todo: implement this
  }

  // both AA & GSC
  async fillMissingMetrics() {
    const missingDates = await this.findMissingMetrics();
    const metrics = await this.dbUpdateService.getPageMetrics(missingDates);

    await this.dbUpdateService.upsertPageMetrics(metrics);
  }

  // Can be made a bit more efficient later by checking for what's missing and calling the appropriate method(s)
  async fillMissingData() {
    this.logger.log('Finding and filling missing data...');
    const gscPageResults = await this.fillMissingGscPageMetrics();
    this.logger.log('Results for GSC pages:', gscPageResults);

    const gscOverallResults = await this.fillMissingGscOverallMetrics();
    this.logger.log('Results for GSC overall:', gscOverallResults);

    // todo: add more (i.e. AA, GSC search terms, etc.)
  }

  async findMissingGscPageMetrics() {
    const missingDays = (
      await this.pageMetricsModel
        .find({
          url: 'www.canada.ca/en/revenue-agency/services/e-services/represent-a-client.html',
          gsc_total_impressions: { $exists: false },
        })
        .exec()
    ).map(({ date }) => date);

    if (missingDays.length === 0) {
      this.logger.log('Found no days in pages_metrics missing gsc data.');
    } else {
      this.logger.log(
        'Found the following days in pages_metrics missing gsc data:'
      );
      this.logger.log(missingDays);
    }

    return missingDays;
  }

  async fillMissingGscPageMetrics() {
    this.logger.log(
      'Finding and filling missing gsc data in pages_metrics...'
    );

    const dates = await this.findMissingGscPageMetrics();

    return await this.dbUpdateService.upsertGscPageMetrics(dates);
  }

  async findMissingGscOverallMetrics() {
    const missingDays = (
      await this.overallModel
        .find(
          {
            gsc_total_impressions: { $exists: false },
          },
          {
            _id: 0,
            date: 1,
          }
        )
        .lean()
        .exec()
    ).map((doc) => doc.date);

    if (missingDays.length === 0) {
      this.logger.log('Found no days in overall_metrics missing gsc data.');
    } else {
      this.logger.log(
        'Found the following days in overall_metrics missing gsc data:'
      );
      this.logger.log(missingDays);
    }

    return missingDays;
  }

  async fillMissingGscOverallMetrics() {
    this.logger.log(
      'Finding and filling any missing gsc data in overall_metrics...'
    );

    const dates = await this.findMissingGscOverallMetrics();

    return await this.dbUpdateService.upsertOverallGscMetrics(dates);
  }

  async findInvalidUrls(outputFilePath?: string) {
    // first pages, then page metrics
    const maybeInvalidPages = await this.pageModel
      .find({ url: /\.html.+?\.html/i }, { _id: 0, url: 1 })
      .lean()
      .exec();

    if (outputFilePath) {
      await outputCsv(outputFilePath, maybeInvalidPages as any[]);
      this.logger.log(`Invalid URLs written to ${outputFilePath}`);
    } else {
      this.logger.log('Invalid pages results: ', maybeInvalidPages);
      return maybeInvalidPages;
    }
  }

  async cleanPageUrls() {
    this.logger.log('Cleaning page urls...');

    await this.pageModel.updateMany(
      { url: /^https/i },
      [
        {
          $set: {
            url: {
              $replaceOne: {
                input: '$url',
                find: 'https://',
                replacement: '',
              }
            },
            all_urls: {
              $map: {
                input: { $ifNull: ['$all_urls', []] },
                as: 'url',
                in: {
                  $replaceOne: {
                    input: '$$url',
                    find: 'https://',
                    replacement: '',
                  }
                }
              }
            }
          },
        },
      ]
    );

    this.logger.log('Finished cleaning page urls.');
  }

  async generateMissingDataCsv() {
    const years = [2020, 2021, 2022];

    for (const year of years) {
      const yearQuery = (year: number) => ({
        date: {
          $gte: new Date(`${year}-01-01T00:00:00.000Z`),
          $lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      });

      const results = await this.pageMetricsModel
        .aggregate()
        .sort({ date: 1 })
        .match({
          ...yearQuery(year),
          $or: [
            { visits: { $gt: 0 } },
            { gsc_total_impressions: { $gt: 0 } },
            { gsc_searchterms: { $not: { $size: 0 } } },
          ],
        })
        .group({
          _id: '$date',
          totalCount: { $sum: 1 },
          hasGsc: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$gsc_total_impressions', null] },
                    { $gt: ['$gsc_total_impressions', 0] },
                  ],
                },
                0,
                1,
              ],
            },
          },
          hasGscTerms: {
            $sum: {
              $cond: [
                { $eq: ['array', { $type: '$gsc_searchterms' }] },
                { $cond: [{ $gt: [{ $size: '$gsc_searchterms' }, 0] }, 1, 0] },
                0,
              ],
            },
          },
          hasAAVisits: {
            $sum: {
              $cond: [
                {
                  $and: [{ $ne: ['$visits', null] }, { $gt: ['$visits', 0] }],
                },
                1,
                0,
              ],
            },
          },
          // hasPageRef: {
          //   $sum: {
          //     $cond: [{ $ne: ['$page', null] }, 1, 0],
          //   },
          // },
        })
        .sort({ _id: 1 })
        .exec();

      await outputCsv(`upd-data_integrity-${year}.csv`, results);
    }
  }
}
