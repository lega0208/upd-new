import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AirtableClient,
  PageData,
  TaskData,
  UxTestData,
} from '@dua-upd/external-data';
import {
  CallDriver,
  Feedback,
  Page,
  PagesList,
  Project,
  Task,
  UxTest,
} from '@dua-upd/db';
import type { UxApiData, UxApiDataType, UxData } from './types';
import { arrayToDictionary, WithObjectId } from '@dua-upd/utils-common';
import { assertHasUrl, assertObjectId } from './utils';
import { AttachmentData, IPage, ITask } from '@dua-upd/types-common';
import { BlobStorageService } from '@dua-upd/blob-storage';
import { BlobBeginCopyFromURLResponse } from '@azure/storage-blob';
import chalk from 'chalk';
import { AnyBulkWriteOperation } from 'mongodb';

@Injectable()
export class AirtableService {
  constructor(
    @Inject(AirtableClient.name) private airtableClient: AirtableClient,
    private logger: ConsoleLogger,
    @InjectModel(CallDriver.name, 'defaultConnection')
    private calldriverModel: Model<CallDriver>,
    @InjectModel(Feedback.name, 'defaultConnection')
    private feedbackModel: Model<Feedback>,
    @InjectModel(Page.name, 'defaultConnection') private pageModel: Model<Page>,
    @InjectModel(PagesList.name, 'defaultConnection')
    private pageListModel: Model<PagesList>,
    @InjectModel(Project.name, 'defaultConnection')
    private projectModel: Model<Project>,
    @InjectModel(Task.name, 'defaultConnection') private taskModel: Model<Task>,
    @InjectModel(UxTest.name, 'defaultConnection')
    private uxTestModel: Model<UxTest>,
    @Inject(BlobStorageService.name)
    private blobService: BlobStorageService
  ) {}

  async getUxData(): Promise<UxApiData> {
    this.logger.log('Getting data from Airtable...');
    const tasksData = await this.airtableClient.getTasks();
    const uxTestData = await this.airtableClient.getUxTests();
    const pageData = await this.airtableClient.getPages();
    const tasksTopicsMap = await this.airtableClient.getTasksTopicsMap();

    return { tasksData, uxTestData, pageData, tasksTopicsMap };
  }

  // function to help with getting or creating objectIds, and populating an airtableId to ObjectId map to add references
  private async addObjectIdsAndPopulateIdsMap<
    T extends { _id: Types.ObjectId; airtable_id?: string }
  >(
    data: UxApiDataType[],
    model: Model<T>,
    idsMap: Map<string, Types.ObjectId>
  ): Promise<WithObjectId<UxApiDataType>[]> {
    const airtableIds = data.map((doc) => doc.airtable_id);

    const airtableFilter = { airtable_id: { $in: airtableIds } };
    const urlFilter = {};

    // for Pages, we might already have an entry that wasn't from airtable, so we'll check urls as well
    if (model.modelName === 'Page') {
      assertHasUrl(data);

      const urls = data.map((doc) => doc.url.replace(/^https:\/\//i, ''));

      urlFilter['$or'] = [{ url: { $in: urls } }, { all_urls: { $in: urls } }];
    }

    const existingDataFilter =
      model.modelName === 'Page'
        ? { $or: [airtableFilter, ...urlFilter['$or']] }
        : airtableFilter;

    const existingData =
      (await model.find(existingDataFilter).lean().exec()) || ([] as T[]);

    for (const doc of existingData) {
      idsMap.set(doc.airtable_id, doc._id);
    }

    const allUrlsDict = Object.fromEntries(
      existingData
        .map((page: T) =>
          'all_urls' in page
            ? (<Page>(<unknown>page)).all_urls.map((url) => [url, page])
            : []
        )
        .flat()
    );

    return data.map((doc) => {
      if (!idsMap.get(doc.airtable_id)) {
        // *** @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ <-
        // if Page -> check allUrlsDict for url match -> set to proper _id
        // (+ if this doesn't fix updating the airtable_id, could maybe update it "inline")
        idsMap.set(
          doc.airtable_id,
          allUrlsDict[doc['url']]?._id || new Types.ObjectId()
        );
      }
      return {
        ...doc,
        _id: idsMap.get(doc.airtable_id),
      };
    });
  }

  private async getProjectsFromUxTests(
    uxTestsWithIds: WithObjectId<UxTestData>[],
    idMaps: {
      tasks: Map<string, Types.ObjectId>;
      uxTests: Map<string, Types.ObjectId>;
      pages: Map<string, Types.ObjectId>;
    }
  ): Promise<Project[]> {
    const projectTitles = [
      ...new Set(uxTestsWithIds.map((uxTest) => uxTest.title)),
    ];

    const existingProjects = (await this.projectModel
      .find({ title: { $in: projectTitles } }, { _id: true, title: true })
      .lean()) as { _id: Types.ObjectId; title: string }[];

    return projectTitles.map((projectTitle) => {
      const uxTests = uxTestsWithIds.filter(
        (uxTest) => uxTest.title === projectTitle
      );

      const pageAirtableIds = [
        ...uxTests.reduce((pageIds, uxTest) => {
          for (const pageId of uxTest.pages || []) {
            pageIds.add(pageId);
          }

          return pageIds;
        }, new Set()),
      ] as string[];

      const pageObjectIds = pageAirtableIds.map((pageAirtableId) =>
        idMaps.pages.get(pageAirtableId)
      );

      const taskAirtableIds = [
        ...uxTests.reduce((taskIds, uxTest) => {
          for (const taskId of uxTest.tasks || []) {
            taskIds.add(taskId);
          }

          return taskIds;
        }, new Set()),
      ] as string[];

      const taskObjectIds = taskAirtableIds.map((taskAirtableId) =>
        idMaps.tasks.get(taskAirtableId)
      );

      const existingProject = existingProjects.find(
        (project) => project.title === projectTitle
      );

      // get de-duplicated attachments
      const attachments = uxTests.reduce((attachments, uxTest) => {
        for (const attachment of uxTest.attachments || []) {
          if (!attachments[attachment.filename]) {
            attachments[attachment.filename] = attachment;
          }
        }

        return attachments;
      }, {} as Record<string, AttachmentData>);

      return {
        _id: existingProject?._id || new Types.ObjectId(),
        title: projectTitle,
        ux_tests: uxTests.map((uxTest) => uxTest._id),
        pages: pageObjectIds,
        tasks: taskObjectIds,
        description: uxTests.find((uxTest) => uxTest.description)?.description,
        attachments: Object.values(attachments),
      };
    }) as Project[];
  }

  async getAndPrepareUxData(): Promise<UxData> {
    const { tasksData, uxTestData, pageData, tasksTopicsMap } =
      await this.getUxData();

    const airtableIdToObjectIdMaps = {
      tasks: new Map<string, Types.ObjectId>(),
      uxTests: new Map<string, Types.ObjectId>(),
      pages: new Map<string, Types.ObjectId>(),
    };

    const tasksWithIds = (await this.addObjectIdsAndPopulateIdsMap<Task>(
      tasksData,
      this.taskModel,
      airtableIdToObjectIdMaps.tasks
    )) as WithObjectId<TaskData>[];

    const uxTestsWithIds = (await this.addObjectIdsAndPopulateIdsMap<UxTest>(
      uxTestData,
      this.uxTestModel,
      airtableIdToObjectIdMaps.uxTests
    )) as WithObjectId<UxTestData>[];

    const pagesWithIds = (await this.addObjectIdsAndPopulateIdsMap<Page>(
      pageData,
      this.pageModel,
      airtableIdToObjectIdMaps.pages
    )) as WithObjectId<PageData>[];

    const projectsWithRefs = await this.getProjectsFromUxTests(
      uxTestsWithIds,
      airtableIdToObjectIdMaps
    );

    // finally, add all missing refs each data type
    const uxTestsWithRefs = uxTestsWithIds.map((uxTest) => {
      const project = projectsWithRefs.find(
        (project) => project.title === uxTest.title
      );

      return {
        ...uxTest,
        project: project?._id,
        pages: (uxTest.pages || []).map((pageAirtableId) =>
          airtableIdToObjectIdMaps.pages.get(pageAirtableId)
        ) as Types.ObjectId[],
        tasks: (uxTest.tasks || []).map((taskAirtableId) =>
          airtableIdToObjectIdMaps.tasks.get(taskAirtableId)
        ),
      } as UxTest;
    });

    const tasksWithRefs = tasksWithIds.map((task) => {
      const ux_tests = uxTestsWithRefs.filter((uxTest) => {
        if (uxTest.tasks) {
          assertObjectId(uxTest.tasks);

          return uxTest.tasks?.includes(task._id);
        }
      });

      const projects = [
        ...new Set(ux_tests.map((uxTest) => uxTest.project)),
      ] as Types.ObjectId[];

      const tpc_ids = tasksTopicsMap[task.airtable_id] || [];

      return {
        ...task,
        ux_tests: ux_tests.map((uxTest) => uxTest._id) as Types.ObjectId[],
        projects,
        pages: (task.pages || []).map((pageAirtableId) =>
          airtableIdToObjectIdMaps.pages.get(pageAirtableId)
        ),
        tpc_ids,
      } as ITask;
    });

    const pagesWithRefs = pagesWithIds.map((page) => {
      const ux_tests = uxTestsWithRefs.filter((uxTest) => {
        if (uxTest.pages) {
          assertObjectId(uxTest.pages);

          return uxTest.pages?.includes(page._id);
        }
      });

      const projects = [
        ...new Set(ux_tests.map((uxTest) => uxTest.project)),
      ] as Types.ObjectId[];

      const tasks = page.tasks?.map((taskAirtableId) =>
        airtableIdToObjectIdMaps.tasks.get(taskAirtableId)
      );

      return {
        ...page,
        ux_tests: ux_tests.map((uxTest) => uxTest._id) as Types.ObjectId[],
        projects,
        tasks,
      } as IPage;
    });

    return {
      tasks: tasksWithRefs,
      uxTests: uxTestsWithRefs,
      pages: pagesWithRefs,
      projects: projectsWithRefs,
    };
  }

  async updateUxData() {
    const { tasks, uxTests, pages, projects } =
      await this.getAndPrepareUxData();

    const pageUpdateOps = pages.map((page) => ({
      updateOne: {
        filter: { _id: page._id },
        update: {
          $setOnInsert: {
            _id: page._id,
            title: page.title,
            url: page.url,
          },
          $addToSet: {
            all_urls: page.url,
          },
          $set: {
            airtable_id: page.airtable_id,
            tasks: page.tasks || [],
            projects: page.projects || [],
            ux_tests: page.ux_tests || [],
          },
        },
        upsert: true,
      },
    }));

    this.logger.log('Writing Pages to db');
    await this.pageModel.bulkWrite(
      pageUpdateOps as AnyBulkWriteOperation<Page>[]
    );

    const taskUpdateOps = tasks.map((task) => ({
      replaceOne: {
        filter: { _id: task._id },
        replacement: task as Task,
        upsert: true,
      },
    }));

    this.logger.log('Writing Tasks to db');
    await this.taskModel.bulkWrite(taskUpdateOps);

    this.logger.log('Pruning old Tasks');
    const currentTaskAirtableIds = tasks.map((task) => task.airtable_id);
    const taskPruningResults = await this.taskModel.deleteMany({
      airtable_id: { $nin: currentTaskAirtableIds },
    });
    this.logger.log(`Pruned ${taskPruningResults.deletedCount} Tasks`);

    const uxTestUpdateOps = uxTests.map((uxTest) => ({
      replaceOne: {
        filter: { _id: uxTest._id },
        replacement: uxTest as UxTest,
        upsert: true,
      },
    }));

    this.logger.log('Writing UX tests to db');
    await this.uxTestModel.bulkWrite(uxTestUpdateOps);

    this.logger.log('Pruning old UX tests');
    const currentUxTestAirtableIds = uxTests.map(
      (uxTest) => uxTest.airtable_id
    );
    const uxTestPruningResults = await this.uxTestModel.deleteMany({
      airtable_id: { $nin: currentUxTestAirtableIds },
    });
    this.logger.log(`Pruned ${uxTestPruningResults.deletedCount} UX tests`);

    const projectUpdateOps = projects.map((project) => ({
      replaceOne: {
        filter: { _id: project._id },
        replacement: project,
        upsert: true,
      },
    }));
    this.logger.log('Writing Projects to db');
    await this.projectModel.bulkWrite(
      projectUpdateOps as AnyBulkWriteOperation<Project>[]
    );

    this.logger.log('Pruning old Projects');
    const currentProjectIds = projects.map((project) => project._id);
    const projectPruningResults = await this.projectModel.deleteMany({
      _id: { $nin: currentProjectIds },
    });
    this.logger.log(`Pruned ${projectPruningResults.deletedCount} Projects`);

    this.logger.log('Successfully updated Airtable data');

    // async functions can sometimes behave weirdly if you
    //  don't have a return value that depends on an awaited promise
    return await Promise.resolve();
  }

  async updatePagesList() {
    this.logger.log('Updating Published Pages list from Airtable');
    const currentPagesList =
      (await this.pageListModel.find().sort({ updatedAt: -1 }).lean().exec()) ||
      [];

    const currentUrlsDict = arrayToDictionary(currentPagesList, 'url');

    const lastUpdated = currentPagesList.length
      ? currentPagesList[0].updatedAt
      : new Date(0);

    const airtableList = await this.airtableClient.getPagesList(lastUpdated);

    if (airtableList.length === 0) {
      return;
    }

    const updatedPages = airtableList.filter(
      (page) => page.url && currentUrlsDict[page.url]
    );

    const updateOps = updatedPages.map((page) => ({
      updateOne: {
        filter: { url: page.url },
        update: page,
      },
    }));

    const newPages = airtableList.filter(
      (page) => page.url && !currentUrlsDict[page.url]
    );

    const newPagesWithIds = newPages.map((page) => ({
      _id: new Types.ObjectId(),
      ...page,
    }));

    await this.pageListModel.insertMany(newPagesWithIds);

    return this.pageListModel.bulkWrite(updateOps);
  }

  async getPagesList() {
    const publishedPagesList =
      (await this.pageListModel.find().lean().exec()) || [];

    if (publishedPagesList.length === 0) {
      throw new Error('No pages found in page list');
    }

    return publishedPagesList;
  }

  async uploadProjectAttachmentsAndUpdateUrls() {
    const projectsWithAttachments = await this.projectModel
      .find(
        { attachments: { $not: { $size: 0 } } },
        { title: 1, attachments: 1 }
      )
      .exec();

    const promises = [];

    for (const project of projectsWithAttachments) {
      const promise = Promise.all(
        project.attachments.map(({ url, filename, size }) => {
          const blobClient =
            this.blobService.blobModels.project_attachments.blob(filename);

          const response = blobClient.copyFromUrlIfDifferent(url, size);

          return (response || Promise.resolve()).then((response) => ({
            response,
            blobClient,
          }));
        })
      )
        .then((results) => {
          for (const result of results) {
            const fileName = result.blobClient.filename;
            const blobUrl = result.blobClient.url;

            if (result.response) {
              if (result.response.copyStatus !== 'success') {
                this.logger.warn(
                  chalk.yellow(
                    `File ${fileName} has a copy status of ${result.response.copyStatus}`
                  )
                );
              }
            }

            const attachmentIndex = project.attachments.findIndex(
              ({ filename }) => filename === fileName
            );

            project.attachments[attachmentIndex].storage_url = blobUrl;
            project.attachments[attachmentIndex].storage_url = blobUrl;
          }

          return project.save();
        })
        .catch((err) =>
          this.logger.error(
            `An error occurred uploading attachments for ${project.title}: `,
            err.stack
          )
        );

      promises.push(promise);
    }

    const results = await Promise.allSettled(promises);

    const rejectedResults = results.filter(
      (result) => result.status === 'rejected'
    );

    if (rejectedResults.length) {
      this.logger.error(
        `${rejectedResults.length} Projects had errors uploading attachments`
      );
    }

    this.logger.log('Finished uploading attachments');
  }
}
