import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import type {
  PageDocument,
  PageMetricsModel,
  PagesListDocument,
} from '@dua-upd/db';
import { Page, PageMetrics, PagesList, PagesListItem } from '@dua-upd/db';
import {
  DateRange,
  queryDateFormat,
  singleDatesFromDateRange,
  AdobeAnalyticsClient,
  SearchAnalyticsClient,
  AirtableClient,
  PageListData,
} from '@dua-upd/external-data';
import { PagesListService } from '../pages-list/pages-list.service';
import { arrayToDictionary, logJson } from '@dua-upd/utils-common';
import { AnyBulkWriteOperation } from 'mongodb';

dayjs.extend(utc);

@Injectable()
export class PageMetricsService {
  constructor(
    @Inject(AdobeAnalyticsClient.name)
    private adobeAnalyticsClient: AdobeAnalyticsClient,
    @Inject(AirtableClient.name) private airtableClient: AirtableClient,
    @Inject(SearchAnalyticsClient.name)
    private gscClient: SearchAnalyticsClient,
    private logger: ConsoleLogger,
    @InjectModel(Page.name, 'defaultConnection') private pageModel: Model<Page>,
    @InjectModel(PageMetrics.name, 'defaultConnection')
    private pageMetricsModel: PageMetricsModel,
    @InjectModel(PagesList.name, 'defaultConnection')
    private pageListModel: Model<PagesList>,
    private pagesListService: PagesListService
  ) {}

  async fetchAndMergePageMetrics(dateRange: DateRange) {
    const [aaResults, gscResults] = await Promise.all([
      this.adobeAnalyticsClient
        .getPageMetrics(dateRange, {
          // temporary fix for pages longer than 255 characters
          search: {
            clause: `BEGINS-WITH 'www.canada.ca' AND (BEGINS-WITH 'www.canada.ca/en/revenue-agency'\
        OR BEGINS-WITH 'www.canada.ca/fr/agence-revenu' OR BEGINS-WITH 'www.canada.ca/fr/services/impots'\
        OR BEGINS-WITH 'www.canada.ca/en/services/taxes')`,
          },
        })
        // replace urls longer than 255 characters with url from published pages list
        .then(async (results) => {
          const publishedPagesList =
            (await this.pageListModel.find().lean().exec()) || [];

          if (publishedPagesList.length === 0) {
            throw new Error('No pages found in page list');
          }

          // separate en/fr pages and restructure data to make cross-referencing faster
          const publishedPages = (publishedPagesList as PagesListItem[]).reduce(
            (pages, page) => {
              const url = page.last_255; // use last 255 to match AA urls

              if (page.lang === 'en') {
                pages['en'][url] = page;
              } else if (page.lang === 'fr') {
                pages['fr'][url] = page;
              }

              return pages;
            },
            { en: {}, fr: {} } as Record<
              'en' | 'fr',
              Record<string, PageListData>
            >
          );

          const langRegex = /canada\.ca\/(en|fr)/i;

          return results.map((dayResults) => {
            return dayResults.map((result) => {
              if (result.url.startsWith('www.canada.ca')) {
                return result;
              }

              const lang = langRegex.exec(result.url)?.[1];

              return {
                ...result,
                url: publishedPages[lang]?.[result.url]?.url || result.url,
              };
            });
          });
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
      .flat() as PageMetrics[];
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
      const dateRanges = singleDatesFromDateRange(
        fullDateRange,
        queryDateFormat
      ).map((date) => ({
        start: date,
        end: dayjs.utc(date).add(1, 'day').format(queryDateFormat),
      }));

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
    const duplicates = await this.pageModel
      .aggregate()
      .sort({ all_urls: 1 })
      .unwind('$all_urls')
      .group({
        _id: '$all_urls',
        pageIds: {
          $push: '$_id',
        },
        count: {
          $sum: 1,
        },
      })
      .match({
        count: {
          $gt: 1,
        },
      })
      .exec();

    if (duplicates.length > 0) {
      throw new Error(
        `Found pages with duplicated URLs- Cannot add references:\r\n ${JSON.stringify(
          duplicates,
          null,
          2
        )}`
      );
    }

    // We can only associate metrics with pages from airtable if we want to map them to tasks/tests/projects
    // -> Iterate through pages w/ airtable_id and add refs to metric docs w/ url in all_urls
    const existingAirtablePages = (await this.pageModel.find({
      airtable_id: { $exists: true },
    })) as Page[];

    const bulkWriteOps = existingAirtablePages.map((page) => ({
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

    this.logger.log('Write results (Pages w/ airtable_id): ');
    this.logger.log(airtablePageResults);

    // Now for metrics that don't have refs, add a page ref if it's in the page's all_urls
    const metricsUrls = (await this.pageMetricsModel
      .distinct('url', { page: { $exists: false } })
      .exec()) as string[];

    this.logger.log(
      `Adding references for ${metricsUrls.length} urls without airtable IDs`
    );

    const nonAirtableBulkWriteOps = [];

    const newPages: Page[] = [];
    const newPageRefsBulkWriteOps = [];

    const publishedPagesList =
      (await this.pageListModel.find().lean().exec()) || [];

    if (publishedPagesList.length === 0) {
      throw new Error('No pages found in page list');
    }

    // separate en/fr pages and restructure data to make cross-referencing faster
    const publishedPages = (publishedPagesList as PagesListItem[]).reduce(
      (pages, page) => {
        const url = page.last_255; // use last 255 to match AA urls

        if (page.lang === 'en') {
          pages['en'][url] = page;
        } else if (page.lang === 'fr') {
          pages['fr'][url] = page;
        }

        return pages;
      },
      { en: {}, fr: {} } as Record<'en' | 'fr', Record<string, PageListData>>
    );

    const langRegex = /canada\.ca\/(en|fr)/i;

    const existingPagesResults = await this.pageModel
      .find({
        airtable_id: { $exists: false },
        all_urls: {
          $elemMatch: { $in: metricsUrls },
        },
      })
      .lean()
      .exec();

    const existingPages = existingPagesResults.reduce(
      (existingPages, page) => {
        const lang = langRegex.exec(page.url)?.[1];

        existingPages[lang][page.url] = page;

        return existingPages;
      },
      { en: {}, fr: {} } as Record<'en' | 'fr', Record<string, Page>>
    );

    for (const url of metricsUrls) {
      const lang = langRegex.exec(url)?.[1];

      const page = existingPages[lang]?.[url];

      if (page) {
        nonAirtableBulkWriteOps.push({
          updateMany: {
            filter: { url },
            update: {
              $set: {
                page: page._id,
              },
            },
          },
        });

        continue;
      }

      // if page doesn't already exist, check if it's in the published pages list
      const publishedPage = publishedPages[lang]?.[url];

      if (publishedPage) {
        const _id = new Types.ObjectId();

        newPages.push({
          _id,
          title: publishedPage.title,
          url: publishedPage.url,
          all_urls: [publishedPage.url],
        });

        newPageRefsBulkWriteOps.push({
          updateMany: {
            filter: { url },
            update: {
              $set: {
                page: _id,
              },
            },
          },
        });
      }
    }

    this.logger.log('New pages length: ', newPages.length);
    this.logger.log(JSON.stringify(newPages, null, 2));
    this.logger.log(
      'Page ref insert ops length: ',
      newPageRefsBulkWriteOps.length
    );
    this.logger.log(JSON.stringify(newPageRefsBulkWriteOps, null, 2));

    // update refs while waiting for new pages to be fetched
    this.logger.log('Updating page metrics with page refs from existing pages');

    await this.pageMetricsModel.bulkWrite(nonAirtableBulkWriteOps, {
      ordered: false,
    });

    this.logger.log('Finished adding Page references to Page Metrics.');

    this.logger.log('Inserting new pages into database...');

    await this.pageModel.insertMany(newPages);

    this.logger.log('Successfully inserted new Pages into database.');

    this.logger.log('Updating page metrics with page refs from new pages...');

    await this.pageMetricsModel.bulkWrite(newPageRefsBulkWriteOps, {
      ordered: false,
    });

    const totalRefsAdded =
      newPageRefsBulkWriteOps.length + nonAirtableBulkWriteOps.length;

    this.logger.log(
      `Successfully added ${totalRefsAdded} references to Page Metrics`
    );
  }

  async ensureRefs(urls: string[]) {
    this.logger.log(
      'Ensuring Page Metrics have appropriate Page references...'
    );
    // ASSUMING ALL_URLS ARE DEDUPLICATED (todo: add check and dedupe if necessary)
    const existingPages =
      (await this.pageModel
        .aggregate<{
          _id: Types.ObjectId;
          url: string;
          projects: Types.ObjectId;
          tasks: Types.ObjectId;
          ux_tests: Types.ObjectId;
        }>()
        .match({
          all_urls: {
            $elemMatch: { $in: urls },
          },
        })
        .unwind('$all_urls')
        .project({ url: '$all_urls', projects: 1, tasks: 1, ux_tests: 1 })
        .exec()) || [];

    const existingPagesDict = arrayToDictionary(existingPages, 'url');

    const existingUrls = Object.keys(existingPagesDict);

    // create new pages first, then perform all updates in one bulk write
    const newPages = urls.filter((url) => !existingUrls.includes(url));

    const pagesListData = await this.pagesListService.getPagesList();

    if (pagesListData.length === 0) {
      throw new Error('No pages found in page list');
    }

    const pagesListUrls = pagesListData.map((page) => page.url);

    const noMatchUrls = newPages.filter((url) => !pagesListUrls.includes(url));

    console.log(
      `${noMatchUrls.length} urls with no match from published pages (most are probably 404s)`
    );

    const publishedPages = await this.pagesListService.getPagesListDictionary();

    const newPagesBulkWriteOps = [];
    const addPageRefsBulkWriteOps = [];

    const langRegex = /canada\.ca\/(en|fr)/i;

    for (const url of newPages) {
      const lang = langRegex.exec(url)?.[1];

      const page: PagesList = publishedPages[lang]?.[url];

      if (!page) {
        continue;
      }

      const _id = new Types.ObjectId();

      newPagesBulkWriteOps.push({
        insertOne: {
          document: {
            _id,
            title: page.title,
            url: page.url,
            all_urls: [page.url],
          },
        },
      });

      addPageRefsBulkWriteOps.push({
        updateMany: {
          filter: { url },
          update: {
            $set: {
              page: _id,
            },
          },
        },
      });
    }

    if (newPagesBulkWriteOps.length) {
      console.log('newPagesBulkWriteOps:');
      console.log(JSON.stringify(newPagesBulkWriteOps, null, 2));
    }

    for (const url of existingUrls) {
      const page = existingPagesDict[url];

      if (page) {
        addPageRefsBulkWriteOps.push({
          updateMany: {
            filter: { url, page: { $ne: page._id } },
            update: {
              $set: {
                page: page._id,
                projects: page.projects,
                tasks: page.tasks,
                ux_tests: page.ux_tests,
              },
            },
          },
        });
      }
    }

    if (newPagesBulkWriteOps.length) {
      this.logger.log(`Inserting ${newPagesBulkWriteOps.length} new pages`);
      await this.pageModel.bulkWrite(newPagesBulkWriteOps, {
        ordered: false,
      });
    }

    if (addPageRefsBulkWriteOps.length) {
      this.logger.log(
        `Adding ${addPageRefsBulkWriteOps.length} Page references`
      );
      await this.pageMetricsModel.bulkWrite(addPageRefsBulkWriteOps, {
        ordered: false,
      });
    }

    this.logger.log('Finished ensuring Page references for Page Metrics');
  }
}
