import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, Model, Types } from 'mongoose';
import { type Filter } from 'mongodb';
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
  PageMetricsTS,
} from '../';
import { AsyncLogTiming, logJson, prettyJson } from '@dua-upd/utils-common';
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
    pageMetricsTS: this.pageMetricsTS,
    pages: this.pages,
    pagesList: this.pagesList,
    tasks: this.tasks,
    uxTests: this.uxTests,
    projects: this.projects,
    aaItemIds: this.aaItemIds,
    searchAssessment: this.searchAssessment,
  } as const;

  readonly views = {
    pageVisits: new PageVisitsView(
      this.pageVisits,
      this.collections.pageMetrics
    ),
  } as const;

  constructor(
    @InjectModel(CallDriver.name, 'defaultConnection')
    private callDrivers: Model<CallDriver>,
    @InjectModel(Feedback.name, 'defaultConnection')
    private feedback: Model<Feedback>,
    @InjectModel(Overall.name, 'defaultConnection')
    private overall: Model<Overall>,
    @InjectModel(PageMetrics.name, 'defaultConnection')
    private pageMetrics: Model<PageMetrics>,
    @InjectModel(PageMetricsTS.name, 'defaultConnection')
    private pageMetricsTS: Model<PageMetricsTS>,
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
                  ...(filter as Filter<PageMetrics>),
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
                  ...(filter as Filter<PageMetrics>),
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
  async addMissingAirtableRefsToPageMetrics() {
    console.log('Checking for missing refs in pages_metrics');

    const projects =
      (await this.projects.find({}, { title: 1, pages: 1 }).lean().exec()) ||
      [];
    const tasks =
      (await this.tasks.find({}, { title: 1, pages: 1 }).lean().exec()) || [];
    const uxTests =
      (await this.uxTests.find({}, { title: 1, pages: 1 }).lean().exec()) || [];

    for (const project of projects) {
      let metricsMissingRefs = await this.pageMetrics
        .find(
          {
            page: { $in: project.pages },
            projects: { $not: { $elemMatch: { $eq: project._id } } },
          },
          { _id: 0, page: 1, projects: 1 }
        )
        .lean()
        .exec();

      if (metricsMissingRefs.length) {
        console.log(
          `Found ${metricsMissingRefs.length} page metrics missing refs for Project: ${project.title}`
        );

        const results = await this.pageMetrics.updateMany(
          {
            page: { $in: project.pages },
            projects: { $not: { $elemMatch: { $eq: project._id } } },
          },
          {
            $addToSet: { projects: project._id },
          }
        );

        console.log('updateResult: ', prettyJson(results));
      }

      // free memory
      metricsMissingRefs = null;
    }

    for (const task of tasks) {
      let metricsMissingRefs = await this.pageMetrics
        .find({
          page: { $in: task.pages },
          tasks: { $not: { $elemMatch: { $eq: task._id } } },
        })
        .lean()
        .exec();

      if (metricsMissingRefs.length) {
        console.log(
          `Found ${metricsMissingRefs.length} page metrics missing refs for Task: ${task.title}`
        );

        const results = await this.pageMetrics.updateMany(
          {
            page: { $in: task.pages },
            tasks: { $not: { $elemMatch: { $eq: task._id } } },
          },
          {
            $addToSet: { tasks: task._id },
          }
        );

        console.log('updateResult: ', prettyJson(results));
      }

      // free memory
      metricsMissingRefs = null;
    }

    for (const uxTest of uxTests) {
      let metricsMissingRefs = await this.pageMetrics
        .find({
          page: { $in: uxTest.pages },
          ux_tests: { $not: { $elemMatch: { $eq: uxTest._id } } },
        })
        .lean()
        .exec();

      if (metricsMissingRefs.length) {
        console.log(
          `Found ${metricsMissingRefs.length} page metrics missing refs for UX Test: ${uxTest.title}`
        );

        const results = await this.pageMetrics.updateMany(
          {
            page: { $in: uxTest.pages },
            ux_tests: { $not: { $elemMatch: { $eq: uxTest._id } } },
          },
          {
            $addToSet: { ux_tests: uxTest._id },
          }
        );

        console.log('updateResult: ', prettyJson(results));
      }

      // free memory
      metricsMissingRefs = null;
    }

    console.log('Finished adding missing refs to pages_metrics.');
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
