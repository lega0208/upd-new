import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Page, PageMetrics } from '@cra-arc/types-common';
import type { PageDocument, PageMetricsModel } from '@cra-arc/types-common';
import { outputCsv } from './utils';
import { DbUpdateService } from '@cra-arc/db-update';

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
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    private dbUpdateService: DbUpdateService
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

  // Figure out what data needs filling and the strategy for filling it
  async fillMissingData() {
    // todo: replace with logic to find dates with missing data
    const bulkInsertOps = [];

    const datesToFill = [
      '2020-09-09',
      '2021-08-12',
      '2021-09-17',
      '2021-10-21',
      '2021-11-09',
      '2021-11-30',
      '2021-12-05',
    ];

    const metrics = await this.dbUpdateService.getPageMetrics(datesToFill);

    await this.dbUpdateService.upsertPageMetrics(metrics);

  }

  async findInvalidUrls(outputFilePath?: string) {
    // first pages, then page metrics
    const maybeInvalidPages = await this.pageModel
      .find({ url: /\.html.+?\.html/i }, { _id: 0, url: 1 })
      .lean()
      .exec();

    if (outputFilePath) {
      await outputCsv(outputFilePath, maybeInvalidPages as any[]);
      console.log(`Invalid URLs written to ${outputFilePath}`);
    } else {
      console.log('Invalid pages results: ', maybeInvalidPages);
      return maybeInvalidPages;
    }
  }

  async generateMissingDataCsv() {
    // high-level:
    // -For each date: (of pages that are present, and also separately for pages from Airtable)
    //    - For each page:
    //    -
    //      - which pages are missing gsc data?
    //      - which pages are missing AA data?
    //      - which pages have a page ref
    //        -is the ref valid?
    //      - which pages have other AT refs?
    //        -how many refs are invalid?

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
