import { fetchAndMergeOverallMetrics, updateOverallMetrics } from './overall-metrics';
import { updatePages } from './pages';
import { toQueryFormat } from '@cra-arc/external-data';
import { writeFile } from 'node:fs/promises';
import { addAAPageMetrics, fetchAndMergePageMetrics } from './pages-metrics';
import { getAndPrepareUxData, updateUxData } from './airtable';
import {
  getDbConnectionString,
  getPageModel,
  getProjectModel,
  getTaskModel,
  getUxTestModel,
  Page,
  Project,
  UxTest,
} from '@cra-arc/db';
import { connect, Types } from 'mongoose';
import { updateCalldriverData } from './airtable/calldrivers';

// need to set a bigger timout because AA is super slow :)
jest.setTimeout(30 * 60 * 1000);

describe('woweee', () => {
  it('should update', async () => {
    const dateRange = {
      start: toQueryFormat('2020-12-01'),
      end: toQueryFormat('2021-12-03'),
    }

    const results = await addAAPageMetrics(dateRange);
    // console.log(results[0]);
    // const results = await updateOverallMetrics();
    // const results = await fetchAndMergePageMetrics(dateRange);
    // await writeFile('../fat-results.json', JSON.stringify(results, null, 2));
    expect(results).toBeDefined();
  })
  // it('should update UX data', async () => {
  //   const results = await updateUxData();
  //   // await writeFile('big_AT_results.json', JSON.stringify(results, null, 2), 'utf8');
  //   expect(results).toBeDefined();
  // })

  // it('should update calldrivers', async () => {
  //
  //   const results = await updateCalldriverData();
  //   console.log(results);
  //
  //   expect((results)).toBeDefined();
  // })

  // it('should populate references', async () => {
  //   await connect(getDbConnectionString());
  //
  //   const taskModel = getTaskModel();
  //   getPageModel();
  //   getProjectModel();
  //   getUxTestModel();
  //
  //   const populatedResults = await taskModel
  //     .findOne({ _id: new Types.ObjectId('621d280492982ac8c344d19a') })
  //     .populate<{ pages: Page[] }>('pages', 'title')
  //     .populate<{ projects: Project[] }>('projects', 'title')
  //     .populate<{ ux_tests: UxTest[] }>('ux_tests', 'airtable_id');
  //
  //   console.log(populatedResults);
  //
  //   expect(populatedResults).toBeDefined()
  // });
})

describe.skip('updateOverallMetrics', () => {
  it('should work', async () => {
    const insertedDocs = await updateOverallMetrics();
    expect(insertedDocs).toBeDefined();
  });
});

describe.skip('updatePages', () => {
  it('should work', async () => {
    const insertedDocs = await updatePages();
    expect(insertedDocs).toBeDefined();
  });
});
