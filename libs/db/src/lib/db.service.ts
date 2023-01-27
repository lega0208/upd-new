import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, Model } from 'mongoose';
import {
  CallDriver,
  Feedback,
  Overall,
  PageMetrics,
  Page,
  PagesList,
  Task,
  UxTest,
  Project,
  AAItemId,
  SearchAssessment,
} from '../';
import {
  AsyncLogTiming,
  logJson,
} from '@dua-upd/utils-common';
import { AnyBulkWriteOperation } from 'mongodb';
import { PageVisits, PageVisitsView } from './db.views';

/**
 * This service is primarily for accessing all collection models from the same place
 * via DbService.collections
 *
 * MongoDB references:
 * [CRUD Operations docs]{@link https://www.mongodb.com/docs/v4.4/crud/}
 * [Aggregation pipeline explainer]{@link https://www.mongodb.com/docs/v4.4/core/aggregation-pipeline/}
 * [Aggregation pipeline reference]{@link https://www.mongodb.com/docs/v4.4/reference/aggregation/}
 */
@Injectable()
export class DbService {
  readonly collections = {
    callDrivers: this.callDrivers,
    feedback: this.feedback,
    overall: this.overall,
    pageMetrics: this.pageMetrics,
    pages: this.pages,
    pagesList: this.pagesList,
    tasks: this.tasks,
    uxTests: this.uxTests,
    projects: this.projects,
    aaItemIds: this.aaItemIds,
    searchAssessment: this.searchAssessment,
  };

  readonly views = {
    pageVisits: new PageVisitsView(
      this.pageVisits,
      this.collections.pageMetrics
    ),
  };

  constructor(
    @InjectModel(CallDriver.name, 'defaultConnection')
    private callDrivers: Model<CallDriver>,
    @InjectModel(Feedback.name, 'defaultConnection')
    private feedback: Model<Feedback>,
    @InjectModel(Overall.name, 'defaultConnection')
    private overall: Model<Overall>,
    @InjectModel(PageMetrics.name, 'defaultConnection')
    private pageMetrics: Model<PageMetrics>,
    @InjectModel(Page.name, 'defaultConnection')
    private pages: Model<Page>,
    @InjectModel(PagesList.name, 'defaultConnection')
    private pagesList: Model<PagesList>,
    @InjectModel(Task.name, 'defaultConnection')
    private tasks: Model<Task>,
    @InjectModel(UxTest.name, 'defaultConnection')
    private uxTests: Model<UxTest>,
    @InjectModel(Project.name, 'defaultConnection')
    private projects: Model<Project>,
    @InjectModel(AAItemId.name, 'defaultConnection')
    private aaItemIds: Model<AAItemId>,
    @InjectModel(SearchAssessment.name, 'defaultConnection')
    private searchAssessment: Model<SearchAssessment>,
    @InjectModel(PageVisitsView.name, 'defaultConnection')
    private pageVisits: Model<PageVisits>
  ) {}

  @AsyncLogTiming
  async validatePageMetricsRefs(filter: FilterQuery<PageMetrics> = {}) {
    if (JSON.stringify(filter) === JSON.stringify({})) {
      return await this.validateAllPageMetricsRefs();
    }

    return await this.validateFilteredPageMetricsRefs(filter);
  }

  private async validateAllPageMetricsRefs() {
    const pageMetricsUrls = await this.pageMetrics.distinct('url');

    if (!pageMetricsUrls?.length) {
      return;
    }

    const bulkWriteOps: AnyBulkWriteOperation[] = [];

    const pages: Page[] = await this.pages
      .find({}, { all_urls: 1, projects: 1, ux_tests: 1, tasks: 1 })
      .lean()
      .exec();

    if (pages) {
      // WE'RE ASSUMING THAT PAGE ALL_URLS ARE DE-DUPLICATED (todo: add check and dedupe first if needed)
      const pagesDict: Record<string, Page> = Object.fromEntries(
        pages.map((page) => page.all_urls.map((url) => [url, page])).flat()
      );

      for (const metricsUrl of pageMetricsUrls) {
        const matchingPage = pagesDict[metricsUrl];

        if (matchingPage) {
          bulkWriteOps.push({
            updateMany: {
              filter: {
                url: metricsUrl,
                page: {
                  $ne: matchingPage._id,
                },
              },
              update: {
                $set: {
                  page: matchingPage._id,
                  projects: matchingPage.projects,
                  tasks: matchingPage.tasks,
                  ux_tests: matchingPage.ux_tests,
                },
              },
            },
          });
        }
      }

      if (bulkWriteOps.length) {
        const writeResults = await this.pageMetrics.bulkWrite(
          bulkWriteOps as AnyBulkWriteOperation<PageMetrics>[],
          {
            ordered: false,
          }
        );
        console.log('validateAllPageRefs writeResults:');
        logJson(writeResults);
      }
    }
  }

  private async validateFilteredPageMetricsRefs(
    filter: FilterQuery<PageMetrics>
  ) {
    const pageMetrics: PageMetrics[] = await this.pageMetrics
      .find(filter, { page: 1, url: 1 })
      .lean()
      .exec();

    if (!pageMetrics) {
      return;
    }

    const bulkWriteOps: AnyBulkWriteOperation[] = [];

    // first check metrics without refs to see if we can add any
    const metricsWithNoRefs = pageMetrics.filter((metrics) => !metrics.page);

    if (metricsWithNoRefs.length) {
      const uniqueUrls = [
        ...new Set(metricsWithNoRefs.map((metrics) => metrics.url)),
      ];

      const pages: Page[] = await this.pages
        .find(
          {
            all_urls: {
              $elemMatch: {
                $in: uniqueUrls,
              },
            },
          },
          { all_urls: 1, projects: 1, ux_tests: 1, tasks: 1 }
        )
        .lean()
        .exec();

      if (pages) {
        // WE'RE ASSUMING THAT PAGE ALL_URLS ARE DE-DUPLICATED (todo: add check to dedupe first if needed)
        const pagesDict: Record<string, Page> = Object.fromEntries(
          pages.map((page) => page.all_urls.map((url) => [url, page])).flat()
        );

        for (const url of uniqueUrls) {
          const matchingPage = pagesDict[url];

          if (matchingPage) {
            bulkWriteOps.push({
              updateMany: {
                filter: {
                  ...filter,
                  url,
                  page: {
                    $ne: matchingPage._id,
                  },
                },
                update: {
                  $set: {
                    page: matchingPage._id,
                    projects: matchingPage.projects,
                    tasks: matchingPage.tasks,
                    ux_tests: matchingPage.ux_tests,
                  },
                },
              },
            });
          }
        }
      }
    }

    // then check metrics with refs to see if any are invalid, and update them where possible
    const metricsWithRefs = pageMetrics.filter((metrics) => metrics.page);

    if (metricsWithRefs.length) {
      const uniqueUrls = [
        ...new Set(metricsWithRefs.map((metrics) => metrics.url)),
      ];

      const pages: Page[] = await this.pages
        .find(
          {
            all_urls: {
              $elemMatch: {
                $in: uniqueUrls,
              },
            },
          },
          { all_urls: 1, projects: 1, ux_tests: 1, tasks: 1 }
        )
        .lean()
        .exec();

      if (pages) {
        // WE'RE ASSUMING THAT PAGE ALL_URLS ARE DE-DUPLICATED (todo: add check to dedupe first if needed)
        const pagesDict: Record<string, Page> = Object.fromEntries(
          pages.map((page) => page.all_urls.map((url) => [url, page])).flat()
        );

        for (const url of uniqueUrls) {
          const matchingPage = pagesDict[url];

          if (matchingPage) {
            bulkWriteOps.push({
              updateMany: {
                filter: {
                  ...filter,
                  url,
                  page: {
                    $ne: matchingPage._id,
                  },
                },
                update: {
                  $set: {
                    page: matchingPage._id,
                    projects: matchingPage.projects,
                    tasks: matchingPage.tasks,
                    ux_tests: matchingPage.ux_tests,
                  },
                },
              },
            });
          }
        }
      }
    }

    console.log(`${bulkWriteOps.length} bulkWriteOps`);

    await this.pageMetrics.bulkWrite(
      bulkWriteOps as AnyBulkWriteOperation<PageMetrics>[],
      { ordered: false }
    );
  }

  @AsyncLogTiming
  async getDuplicatedPages() {
    const duplicates = await this.pages
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

    logJson(duplicates);

    console.log(`${duplicates.length} ✌duplicates✌ found`);

    return duplicates;
  }
}
