import { connect, Document, Model, Types } from 'mongoose';
import { WithObjectId } from '@cra-arc/utils-common';
import {
  AirtableClient,
  PageData,
  TaskData,
  UxTestData,
} from '@cra-arc/external-data';
import {
  Page,
  Project,
  Task,
  UxTest,
  getPageModel,
  getTaskModel,
  getProjectModel,
  getUxTestModel,
  getDbConnectionString,
} from '@cra-arc/db';
import { assertHasUrl, assertObjectId } from './utils';
import type { UxApiDataType, UxData, UxApiData } from './types';

export * from './calldrivers';
export * from './feedback';
export * from './duplicate-pages';
export * from './types';

export async function getUxData(): Promise<UxApiData> {
  const client = new AirtableClient();
  console.log('Getting data from Airtable...');
  const tasksData = await client.getTasks();
  const uxTestData = await client.getUxTests();
  const pageData = await client.getPages();
  const tasksTopicsMap = await client.getTasksTopicsMap();

  return { tasksData, uxTestData, pageData, tasksTopicsMap };
}

// function to help with getting or creating objectIds, and populating an airtableId to ObjectId map to add references
export async function addObjectIdsAndPopulateIdsMap<T>(
  data: UxApiDataType[],
  model: Model<Document<T>>,
  idsMap: Map<string, Types.ObjectId>
): Promise<WithObjectId<UxApiDataType>[]> {
  const airtableIds = data.map((doc) => doc.airtable_id);

  const airtableFilter = { airtable_id: { $in: airtableIds } };
  const urlFilter = {};

  // for Pages, we might already have an entry that wasn't from airtable, so we'll check urls as well
  if (model.name === 'Page') {
    assertHasUrl(data);

    const urls = data.map((doc) => doc.url.replace(/^https:\/\//i, ''));

    urlFilter['$or'] = [{ url: { $in: urls } }, { all_urls: { $in: urls } }];
  }

  const existingDataFilter =
    model.name === 'Page'
      ? { $or: [airtableFilter, ...urlFilter['$or']] }
      : airtableFilter;

  const existingData = (await model
    .find(existingDataFilter, { _id: 1, airtable_id: 1 })
    .lean()) as { _id: Types.ObjectId; airtable_id: string }[];

  for (const doc of existingData) {
    idsMap.set(doc.airtable_id, doc._id);
  }

  return data.map((doc) => {
    if (!idsMap.get(doc.airtable_id)) {
      idsMap.set(doc.airtable_id, new Types.ObjectId());
    }
    return {
      ...doc,
      _id: idsMap.get(doc.airtable_id),
    };
  });
}

async function getProjectsFromUxTests(
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

  const existingProjects = (await getProjectModel()
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

    return {
      _id: existingProject?._id || new Types.ObjectId(),
      title: projectTitle,
      ux_tests: uxTests.map((uxTest) => uxTest._id),
      pages: pageObjectIds,
      tasks: taskObjectIds,
    };
  }) as Project[];
}

export async function getAndPrepareUxData(): Promise<UxData> {
  const { tasksData, uxTestData, pageData, tasksTopicsMap } = await getUxData();

  const airtableIdToObjectIdMaps = {
    tasks: new Map<string, Types.ObjectId>(),
    uxTests: new Map<string, Types.ObjectId>(),
    pages: new Map<string, Types.ObjectId>(),
  };

  await connect(getDbConnectionString());

  const tasksWithIds = (await addObjectIdsAndPopulateIdsMap<Task>(
    tasksData,
    getTaskModel(),
    airtableIdToObjectIdMaps.tasks
  )) as WithObjectId<TaskData>[];

  const uxTestsWithIds = (await addObjectIdsAndPopulateIdsMap<UxTest>(
    uxTestData,
    getUxTestModel(),
    airtableIdToObjectIdMaps.uxTests
  )) as WithObjectId<UxTestData>[];

  const pagesWithIds = (await addObjectIdsAndPopulateIdsMap<Page>(
    pageData,
    getPageModel(),
    airtableIdToObjectIdMaps.pages
  )) as WithObjectId<PageData>[];

  const projectsWithRefs = await getProjectsFromUxTests(
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
    } as Task;
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
    } as Page;
  });

  return {
    tasks: tasksWithRefs,
    uxTests: uxTestsWithRefs,
    pages: pagesWithRefs,
    projects: projectsWithRefs,
  };
}

export async function updateUxData() {
  await connect(getDbConnectionString());
  const { tasks, uxTests, pages, projects } = await getAndPrepareUxData();

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
        $unset: {
          lastModified: true,
          lastChecked: true,
        },
      },
      upsert: true,
    },
  }));

  console.log('Writing Pages to db');
  await getPageModel().bulkWrite(pageUpdateOps);

  const taskUpdateOps = tasks.map((task) => ({
    replaceOne: {
      filter: { _id: task._id },
      replacement: task,
      upsert: true,
    },
  }));

  console.log('Writing Tasks to db');
  const taskModel = getTaskModel();
  await taskModel.bulkWrite(taskUpdateOps);

  console.log('Pruning old Tasks');
  const currentTaskAirtableIds = tasks.map((task) => task.airtable_id);
  const taskPruningResults = await taskModel.deleteMany({
    airtable_id: { $nin: currentTaskAirtableIds },
  });
  console.log(`Pruned ${taskPruningResults.deletedCount} Tasks`);

  const uxTestUpdateOps = uxTests.map((uxTest) => ({
    replaceOne: {
      filter: { _id: uxTest._id },
      replacement: uxTest,
      upsert: true,
    },
  }));

  console.log('Writing UX tests to db');
  const uxTestModel = getUxTestModel();
  await uxTestModel.bulkWrite(uxTestUpdateOps);

  console.log('Pruning old UX tests');
  const currentUxTestAirtableIds = uxTests.map((uxTest) => uxTest.airtable_id);
  const uxTestPruningResults = await uxTestModel.deleteMany({
    airtable_id: { $nin: currentUxTestAirtableIds },
  });
  console.log(`Pruned ${uxTestPruningResults.deletedCount} UX tests`);

  const projectUpdateOps = projects.map((project) => ({
    replaceOne: {
      filter: { _id: project._id },
      replacement: project,
      upsert: true,
    },
  }));
  console.log('Writing Projects to db');
  const projectModel = getProjectModel();
  await projectModel.bulkWrite(projectUpdateOps);

  console.log('Pruning old Projects');
  const currentProjectIds = projects.map((project) => project._id);
  const projectPruningResults = await projectModel.deleteMany({
    _id: { $nin: currentProjectIds },
  });
  console.log(`Pruned ${projectPruningResults.deletedCount} Projects`);

  console.log('Successfully updated Airtable data');

  // async functions can sometimes behave weirdly if you
  //  don't have a return value that depends on an awaited promise
  return await Promise.resolve();
}
