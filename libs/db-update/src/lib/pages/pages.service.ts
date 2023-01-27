import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import axios from 'axios';
import cheerio from 'cheerio/lib/slim';
import type {
  PageDocument,
  PageMetricsModel,
  ProjectDocument,
  TaskDocument,
  UxTestDocument,
} from '@dua-upd/db';
import {
  AAItemId,
  Page,
  PageMetrics,
  Project,
  Task,
  UxTest,
} from '@dua-upd/db';
import { AsyncLogTiming, logJson, squishTrim, wait } from '@dua-upd/utils-common';

dayjs.extend(duration);

interface PageTitleAndRedirectData extends Pick<Page, '_id' | 'url' | 'title'> {
  isRedirect: boolean;
  titleHasChanged: boolean;
  responseUrl: string;
}

export async function* getPageDataWithRateLimit(
  pages: Page[],
  batchSize: number,
  delay: number,
  logger: ConsoleLogger
) {
  let numProcessed = 0;
  let avgBatchTime = 0;
  const pagesInitialLength = pages.length; // because we're splicing the array, the length will change

  const getPercentDone = () =>
    Math.round((numProcessed / pagesInitialLength) * 100);

  const getETA = () => {
    const processingRate = batchSize / (avgBatchTime || delay);

    const timeRemaining = (pagesInitialLength - numProcessed) / processingRate;
    return dayjs.duration(timeRemaining).format('HH:mm:ss');
  };

  const timer = setInterval(() => {
    logger.log(
      `\r\n${numProcessed}/${pagesInitialLength} page titles/urls checked - ${getPercentDone()}% complete\r\n` +
        `Estimated time remaining: ${getETA()}\r\n`
    );
  }, 2500);

  try {
    while (pages.length > 0) {
      const batchStartTime = Date.now();
      const batch = pages.splice(0, batchSize);

      const promises = batch.map((page) =>
        axios.get(`https://${page['url']}`).then((response) => {
          const isRedirect = response.request._redirectable?._isRedirect;

          const responseUrl = (
            response.request._redirectable?._currentUrl ||
            response.headers.location
          ).replace('https://', '');

          const rawTitle = (/<title>[\s\S]+?<\/title>/.exec(response.data) || [
            '',
          ])[0].replace(/\s+(-|&nbsp;|&ndash;)\s+Canada\.ca/i, '');

          const title = squishTrim(cheerio.load(rawTitle)('title').text());

          const titleHasChanged = page['title'] !== title;

          return {
            _id: page._id,
            url: page.url,
            title,
            isRedirect,
            titleHasChanged,
            responseUrl,
          } as PageTitleAndRedirectData;
        })
      );

      const results = await Promise.allSettled(promises);

      // get 403 errors to see if we've hit the rate limit
      const http403Errors = results.filter(
        (response) =>
          response.status === 'rejected' &&
          response.reason.response?.status === 403
      );

      const pageData = results
        .filter((response) => response.status === 'fulfilled')
        .map((response) => response['value'])
        .filter(
          (page) => page.isRedirect || page.titleHasChanged
        ) as PageTitleAndRedirectData[];

      if (Object.keys(pageData).length > 0) {
        yield pageData;
      }

      if (http403Errors.length > 0) {
        delay = delay * 2;
        logger.warn(`Rate limit exceeded, delay increased to ${delay}ms`);
        // wait 5 seconds if rate limit is exceeded
        await wait(5000);
      }
      await wait(delay);

      numProcessed += batchSize;

      const batchTime = Date.now() - batchStartTime;
      avgBatchTime = (avgBatchTime + batchTime) / 2;
    }
  } finally {
    clearInterval(timer);
  }
}

@Injectable()
export class PageUpdateService {
  constructor(
    private logger: ConsoleLogger,
    @InjectModel(Page.name, 'defaultConnection')
    private pageModel: Model<PageDocument>,
    @InjectModel(Task.name, 'defaultConnection')
    private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name, 'defaultConnection')
    private projectModel: Model<ProjectDocument>,
    @InjectModel(UxTest.name, 'defaultConnection')
    private uxTestModel: Model<UxTestDocument>,
    @InjectModel(PageMetrics.name, 'defaultConnection')
    private pageMetricsModel: PageMetricsModel,
    @InjectModel(AAItemId.name, 'defaultConnection')
    private aaItemIdModel: Model<AAItemId>
  ) {}

  async updatePages() {
    this.logger.log('Updating page titles and urls');

    const twoDaysAgo = dayjs().subtract(2, 'days').toDate();

    const pages = (await this.pageModel
      .find({
        // find pages that have not been checked in the last two days, or that have never been updated
        $or: [
          { lastChecked: { $lte: twoDaysAgo } },
          { lastChecked: { $exists: false } },
        ],
      })
      .lean()) as Page[];

    const pageIds = pages.map((page) => page._id);

    const updateOps = [];

    const pageDataIterator = getPageDataWithRateLimit(
      pages,
      25,
      251,
      this.logger
    );

    // outer for loop is for batches
    for await (const pageDataBatch of pageDataIterator) {
      for (const pageData of pageDataBatch) {
        if (!pageData.isRedirect && !pageData.titleHasChanged) {
          continue;
        }

        if (pageData.isRedirect) {
          this.logger.log(
            `Updating url: \r\n${pageData.url.replace(
              'www.canada.ca',
              ''
            )} to:\r\n${pageData.responseUrl.replace('www.canada.ca', '')}`
          );
        }

        if (pageData.titleHasChanged) {
          this.logger.log(
            `Updating title for ${pageData.responseUrl.replace(
              'www.canada.ca',
              ''
            )} to: \r\n${pageData.title}`
          );
        }

        updateOps.push({
          updateOne: {
            filter: { _id: pageData._id },
            update: {
              $currentDate: { lastChecked: true, lastModified: true },
              $set: { title: pageData.title, url: pageData.responseUrl },
              $addToSet: {
                all_urls: { $each: [pageData.url, pageData.responseUrl] },
              },
            },
          },
        });
      }
    }

    if (updateOps.length > 0) {
      this.logger.log(`Updating ${updateOps.length} pages:`);

      await this.pageModel.bulkWrite(updateOps, { ordered: false });
    }

    // update lastChecked for all pages
    await this.pageModel.updateMany(
      { _id: { $in: pageIds } },
      {
        $currentDate: { lastChecked: true },
      }
    );

    this.logger.log('Successfully updated page titles and urls.');
  }

  @AsyncLogTiming
  async consolidateDuplicatePages() {
    this.logger.log('Checking for duplicate pages:');

    // Get list of duplicated urls
    const results = await this.pageModel
      .aggregate<{ urls: string[] }>()
      .unwind('$all_urls')
      .group({
        _id: '$all_urls',
        count: {
          $sum: 1,
        },
      })
      .match({
        count: {
          $gt: 1,
        },
      })
      .group({
        _id: null,
        urls: {
          $addToSet: '$_id',
        },
      })
      .exec();

    if (!results.length || !results[0].urls.length) {
      this.logger.log('No duplicates found.');
      return;
    }

    const urls = results[0].urls;
    this.logger.log(`Found ${urls.length} duplicated pages -- Consolidating`);
    logJson(urls);

    const updatePageOps = [];
    const deletePageOps = [];
    const removeRefsOps = {
      tasks: [],
      projects: [],
      ux_tests: [],
    };

    // for each url, get all page documents
    for (const url of urls) {
      const pages = await this.pageModel.find({ all_urls: url }).exec();

      if (!pages || !pages.length) {
        this.logger.error(`Could not find pages for url: ${url}`);
      }

      // addToSet all tasks, projects, tests, & all_urls
      //    -> for tasks, projects, & tests of docs being deleted:- delete refs after deleting page doc
      const pageArrays = {
        tasks: [],
        projects: [],
        ux_tests: [],
        all_urls: [],
      };

      for (const page of pages) {
        for (const arrayType of Object.keys(pageArrays)) {
          pageArrays[arrayType] = pageArrays[arrayType].concat(
            page[arrayType] || []
          );
        }
      }

      // arbitrarily choose the first one as main document
      const mainDocument = pages.pop();

      // if main document doesn't have an airtable id, set it to the first one found, if any.
      const airtableId =
        mainDocument.airtable_id ||
        pages.reduce(
          (airtableId, page) => airtableId || page.airtable_id,
          null
        );

      const airtableIdUpdate =
        airtableId && airtableId !== mainDocument.airtable_id
          ? { $set: { airtable_id: airtableId } }
          : {};

      // page consolidation ops: (update main document + delete rest)
      updatePageOps.push({
        updateOne: {
          filter: { _id: mainDocument._id },
          update: {
            $addToSet: {
              tasks: { $each: pageArrays.tasks },
              projects: { $each: pageArrays.projects },
              ux_tests: { $each: pageArrays.ux_tests },
              all_urls: { $each: pageArrays.all_urls },
            },
            ...airtableIdUpdate,
          },
        },
      });

      // delete rest of pages
      for (const page of pages) {
        deletePageOps.push({
          deleteOne: {
            filter: { _id: page._id },
          },
        });
      }

      for (const refHolderType of ['tasks', 'projects', 'ux_tests']) {
        for (const refHolder of pageArrays[refHolderType]) {
          if (!refHolder) {
            continue;
          }

          removeRefsOps[refHolderType].push({
            updateOne: {
              filter: { _id: refHolder },
              update: {
                $pullAll: {
                  pages: pages.map(({ _id }) => _id),
                },
              },
            },
          });
        }
      }

      // Update page metrics refs
      const updatePageMetricsRefsOps = pages.map((page) => ({
        updateMany: {
          filter: { page: page._id },
          update: {
            $set: {
              page: mainDocument._id,
              $addToSet: {
                tasks: { $each: pageArrays.tasks },
                projects: { $each: pageArrays.projects },
                ux_tests: { $each: pageArrays.ux_tests },
              },
            },
          },
        },
      }));

      // Need to update itemId refs too
      const updateItemIdRefsOps = pages.map((page) => ({
        updateMany: {
          filter: { page: page._id },
          update: {
            $set: {
              page: mainDocument._id,
            },
          },
        },
      }));

      // not doing ops in parallel in case one of them fails
      if (updatePageOps.length > 0)
        await this.pageModel.bulkWrite(updatePageOps, { ordered: false });

      if (deletePageOps.length > 0)
        await this.pageModel.bulkWrite(deletePageOps, { ordered: false });

      if (updatePageMetricsRefsOps.length > 0) {
        await this.pageMetricsModel.bulkWrite(updatePageMetricsRefsOps, {
          ordered: false,
        });
      }

      if (updateItemIdRefsOps.length > 0) {
        await this.aaItemIdModel.bulkWrite(updateItemIdRefsOps, {
          ordered: false,
        });
      }

      if (removeRefsOps.ux_tests.length > 0)
        await this.uxTestModel.bulkWrite(removeRefsOps.ux_tests, {
          ordered: false,
        });

      if (removeRefsOps.tasks.length > 0)
        await this.taskModel.bulkWrite(removeRefsOps.tasks, { ordered: false });

      if (removeRefsOps.projects.length > 0)
        await this.projectModel.bulkWrite(removeRefsOps.projects, {
          ordered: false,
        });
    }

    this.logger.log(
      'Operations completed. Verifying new number of duplicates:'
    );
    const newResults = await this.pageModel
      .aggregate<{ urls: string[] }>()
      .project({ all_urls: 1 })
      .unwind('$all_urls')
      .group({
        _id: '$all_urls',
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

    const numDups = newResults?.length || 0;

    const logType = numDups > 0 ? 'error' : 'log';

    this.logger[logType](`Found ${numDups} duplicated Pages`);

    this.logger.log('Finished consolidating duplicates.');
  }
}
