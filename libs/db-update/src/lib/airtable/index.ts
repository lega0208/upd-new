import { connect, Document, Model, Types } from 'mongoose';
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

export interface UxApiData {
  tasksData: TaskData[];
  uxTestData: UxTestData[];
  pageData: PageData[];
}

export type UxApiDataType = TaskData | UxTestData | PageData;

export type UxDataType = Task | UxTest | Page | Project;

export interface UxData {
  tasks: Task[];
  uxTests: UxTest[];
  pages: Page[];
  projects: Project[];
}

export type WithObjectId<T> = T & { _id: Types.ObjectId };

export async function getUxData(): Promise<UxApiData> {
  const client = new AirtableClient();
  const tasksData = await client.getTasks();
  const uxTestData = await client.getUxTests();
  const pageData = await client.getPages();

  return { tasksData, uxTestData, pageData };
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
    ...new Set(uxTestsWithIds.map((uxTest) => uxTest.project_title)),
  ];

  const existingProjects = (await getProjectModel()
    .find({ title: { $in: projectTitles } }, { _id: true, title: true })
    .lean()) as { _id: Types.ObjectId; title: string }[];

  return projectTitles.map((projectTitle) => {
    const uxTests = uxTestsWithIds.filter(
      (uxTest) => uxTest.project_title === projectTitle
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
      uxTests: uxTests.map((uxTest) => uxTest._id),
      pages: pageObjectIds,
      tasks: taskObjectIds,
    };
  }) as Project[];
}

export async function getAndPrepareUxData(): Promise<UxData> {
  const { tasksData, uxTestData, pageData } = await getUxData();

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
      (project) => project.title === uxTest.project_title
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
    const ux_tests = uxTestsWithRefs
      .filter((uxTest) => {
        if (uxTest.tasks) {
          assertObjectId(uxTest.tasks);

          return uxTest.tasks?.includes(task._id);
        }
      });

    const projects = [
      ...new Set(ux_tests.map((uxTest) => uxTest.project)),
    ] as Types.ObjectId[];

    return {
      ...task,
      ux_tests: ux_tests.map((uxTest) => uxTest._id) as Types.ObjectId[],
      projects,
      pages: (task.pages || []).map((pageAirtableId) =>
        airtableIdToObjectIdMaps.pages.get(pageAirtableId)
      ),
    } as Task;
  });

  const pagesWithRefs = pagesWithIds.map((page) => {
    const ux_tests = uxTestsWithRefs
      .filter((uxTest) => {
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

function assertObjectId(
  value: UxDataType[] | Types.ObjectId[]
): asserts value is Types.ObjectId[] {
  for (const item of value) {
    if (!(item instanceof Types.ObjectId)) {
      throw new Error('Not an ObjectId');
    }
  }
}

function assertHasUrl(value: UxApiDataType[]): asserts value is PageData[] {
  if (!value.every((doc) => 'url' in doc)) {
    throw new Error('No URL');
  }
}
