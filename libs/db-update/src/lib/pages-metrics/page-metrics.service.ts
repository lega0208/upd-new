import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import type { PageDocument, PageMetricsModel } from '@cra-arc/db';
import { Page, PageMetrics } from '@cra-arc/db';
import {
  DateRange,
  queryDateFormat,
  datesFromDateRange,
  AdobeAnalyticsClient,
  SearchAnalyticsClient,
} from '@cra-arc/external-data';

dayjs.extend(utc);

@Injectable()
export class PageMetricsService {
  constructor(
    @Inject(AdobeAnalyticsClient.name)
    private adobeAnalyticsClient: AdobeAnalyticsClient,
    @Inject(SearchAnalyticsClient.name)
    private gscClient: SearchAnalyticsClient,
    private logger: ConsoleLogger,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel
  ) {}

  async fetchAndMergePageMetrics(dateRange: DateRange) {
    const [aaResults, gscResults] = await Promise.all([
      this.adobeAnalyticsClient.getPageMetrics(dateRange, {
        // temporary fix for pages longer than 255 characters
        search: {
          clause: `BEGINS-WITH 'www.canada.ca' AND (BEGINS-WITH 'www.canada.ca/en/revenue-agency'\
        OR BEGINS-WITH 'www.canada.ca/fr/agence-revenu' OR BEGINS-WITH 'www.canada.ca/fr/services/impots'\
        OR BEGINS-WITH 'www.canada.ca/en/services/taxes')`,
        },
      }),
      this.gscClient.getPageMetrics(dateRange, { dataState: 'all' }),
    ]);

    // because there'll be potentially tens of thousands of results,
    //   we'll group them by date to merge them more efficiently
    const aaDates = aaResults.map((dateResults) => dateResults[0]?.date);
    const gscDates = gscResults.map((dateResults) => dateResults[0]?.date);

    if (aaDates.length !== gscDates.length) {
      this.logger.error(
        'Mismatched dates between Adobe Analytics and Google Search Console'
      );
    }

    return aaDates
      .map((date) => {
        const aaDateResults = aaResults.find(
          (dateResults) => dateResults[0]?.date.getTime() === date.getTime()
        );
        const gscDateResults =
          gscResults.find(
            (dateResults) => dateResults[0]?.date.getTime() === date.getTime()
          ) || [];

        return aaDateResults.map((aaDateResults) => {
          const gscResults = gscDateResults.find(
            (gscDateResult) => gscDateResult.url === aaDateResults.url
          );

          return {
            _id: new Types.ObjectId(),
            ...aaDateResults,
            ...(gscResults || {}),
          };
        });
      })
      .flat();
  }

  async updatePageMetrics() {
    // get dates required for query
    const latestDateResults = await this.pageMetricsModel
      .findOne({}, { date: 1 })
      .sort({ date: -1 });

    // get the most recent date from the DB, and set the start date to the next day
    const latestDate = latestDateResults?.date
      ? dayjs.utc(latestDateResults['date'])
      : dayjs.utc('2020-01-01');
    const startTime = latestDate.add(1, 'day');

    // collect data up to the start of the current day/end of the previous day
    const cutoffDate = dayjs.utc().startOf('day');

    // fetch data if our db isn't up-to-date
    if (startTime.isBefore(cutoffDate)) {
      const fullDateRange = {
        start: startTime.format(queryDateFormat),
        end: cutoffDate.format(queryDateFormat),
      };

      // to be able to iterate over each day
      const dateRanges = datesFromDateRange(fullDateRange, queryDateFormat).map(
        (date) => ({
          start: date,
          end: dayjs.utc(date).add(1, 'day').format(queryDateFormat),
        })
      );

      for (const dateRange of dateRanges) {
        this.logger.log(
          `\r\nFetching page metrics from AA & GSC for date: ${dateRange.start}\r\n`
        );

        const newPageMetrics = await this.fetchAndMergePageMetrics(dateRange);

        await this.pageMetricsModel.insertMany(newPageMetrics);

        this.logger.log(
          `Successfully inserted page metrics data for: ${dateRange.start}`
        );
      }

      return await Promise.resolve();
    } else {
      this.logger.log('Page metrics already up-to-date.');
    }
  }

  async addRefsToPageMetrics() {
    this.logger.log('Adding references to Page Metrics');

    // First check if there are any pages that share urls. If that's the case we can't associate to a specific Page
    for (const page of (await this.pageModel.find(
      {},
      { all_urls: 1 }
    )) as Page[]) {
      const pagesWithCommonUrls = await this.pageModel.find(
        {
          _id: { $ne: page._id },
          all_urls: {
            $elemMatch: { $in: page.all_urls },
          },
        },
        { _id: 1 }
      );

      if (pagesWithCommonUrls.length > 0) {
        throw new Error(
          `Found pages with duplicated URLs- Cannot add references:\r\n ${JSON.stringify(
            pagesWithCommonUrls,
            null,
            2
          )}`
        );
      }
    }

    // We can only associate metrics with pages from airtable if we want to map them to tasks/tests/projects
    // -> Iterate through pages w/ airtable_id and add refs to metric docs w/ url in all_urls
    const pages = (await this.pageModel.find({
      airtable_id: { $exists: true },
    })) as Page[];

    const bulkWriteOps = pages.map((page) => ({
      updateMany: {
        filter: { url: { $in: page.all_urls } },
        update: {
          $set: {
            page: page._id,
            tasks: page.tasks,
            projects: page.projects,
            ux_tests: page.ux_tests,
          },
        },
      },
    }));
    const airtablePageResults = await this.pageMetricsModel.bulkWrite(
      bulkWriteOps,
      { ordered: false }
    );

    this.logger.log(
      'Write results (Pages w/ airtable_id): '
    );
    this.logger.log(airtablePageResults);

    // Now for metrics that don't have refs, add a page ref if it's in the page's all_urls
    const metricsUrls = await this.pageMetricsModel
      .distinct('url', { page: { $exists: false } })
      .exec();

    const nonAirtableBulkWriteOps = [];

    while (metricsUrls.length !== 0) {
      const batch = metricsUrls.splice(0, 1000);

      const batchMatches = await this.pageModel.find({
        all_urls: { $elemMatch: { $in: batch } },
      });

      if (batchMatches.length === 0) {
        continue;
      }

      for (const url of batch) {
        const matchingPage = (await this.pageModel
          .findOne(
            {
              all_urls: {
                $elemMatch: { $eq: url },
              },
            },
            { _id: 1, url: 1 }
          )
          .lean()) as Page;

        if (matchingPage) {
          nonAirtableBulkWriteOps.push({
            updateMany: {
              filter: { url },
              update: {
                $set: {
                  page: matchingPage._id,
                },
              },
            },
          });
        }
      }
    }

    const results = await this.pageMetricsModel.bulkWrite(
      nonAirtableBulkWriteOps,
      { ordered: false }
    );

    this.logger.log('Write results (Pages w/o airtable_id): ', results);

    this.logger.log('Successfully added references to Page Metrics');
  }

  // For merging AA page metrics data with pre-existing GSC data, or inserting if no match is found
  async upsertAAPageMetrics(pageMetrics: PageMetrics[]) {
    return await this.pageMetricsModel.bulkWrite(
      pageMetrics.map(
        (metrics) => ({
          updateOne: {
            filter: { url: metrics.url, date: metrics.date },
            update: { $set: metrics },
            upsert: true,
          },
        }),
        { ordered: false }
      )
    );
  }

  async addAAPageMetrics(dateRange: DateRange) {
    return await this.adobeAnalyticsClient.getPageMetrics(dateRange, {
      postProcess: this.upsertAAPageMetrics,
      search: {
        clause: `BEGINS-WITH 'www.canada.ca' AND (BEGINS-WITH 'www.canada.ca/en/revenue-agency'\
        OR BEGINS-WITH 'www.canada.ca/fr/agence-revenu' OR BEGINS-WITH 'www.canada.ca/fr/services/impots'\
        OR BEGINS-WITH 'www.canada.ca/en/services/taxes')`,
      },
    });
  }
}
