import { connect } from 'mongoose';
import {
  getPageModel,
  getUxTestModel,
  getTaskModel,
  getProjectModel,
  getDbConnectionString,
} from '@dua-upd/db';

export async function consolidateDuplicatePages() {
  console.log('Checking for duplicated Pages:');
  await connect(getDbConnectionString());

  const pageModel = getPageModel();
  const uxTestModel = getUxTestModel();
  const taskModel = getTaskModel();
  const projectModel = getProjectModel();

  // Get list of duplicated urls
  const results = await pageModel
    .aggregate<{ urls: string[] }>()
    .sort({ url: 1 })
    .group({
      _id: '$url',
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

  if (results.length !== 1) {
    console.log('No duplicates found.')
    return;
  }

  const urls = results[0].urls;
  console.log(`Found ${urls.length} duplicated pages -- Consolidating`);

  const updatePageOps = [];
  const deletePageOps = [];
  const removeRefsOps = {
    tasks: [],
    projects: [],
    ux_tests: [],
  };

  // for each url, get all page documents
  for (const url of urls) {
    const pages = await pageModel.find({ url }).exec();

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

    // not doing ops in parallel in case one of them fails
    if (updatePageOps.length > 0)
      await pageModel.bulkWrite(updatePageOps, { ordered: false });

    if (deletePageOps.length > 0)
      await pageModel.bulkWrite(deletePageOps, { ordered: false });

    if (removeRefsOps.ux_tests.length > 0)
      await uxTestModel.bulkWrite(removeRefsOps.ux_tests, { ordered: false });

    if (removeRefsOps.tasks.length > 0)
      await taskModel.bulkWrite(removeRefsOps.tasks, { ordered: false });

    if (removeRefsOps.projects.length > 0)
      await projectModel.bulkWrite(removeRefsOps.projects, { ordered: false });
  }

  console.log('Operations completed. Verifying new number of duplicates:')
  const newResults = await pageModel
    .aggregate<{ urls: string[] }>()
    .sort({ url: 1 })
    .group({
      _id: '$url',
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

  if (!newResults.length || newResults[0]?.urls?.length === 0) {
    console.log('Found 0 duplicated Pages')
  }

  console.log('Finished consolidating duplicates.');
}
