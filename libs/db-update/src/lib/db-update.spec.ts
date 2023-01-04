import { toQueryFormat } from '@dua-upd/external-data';
import { writeFile } from 'node:fs/promises';

import {
  getDbConnectionString,
  getPageModel,
  getProjectModel,
  getTaskModel,
  getUxTestModel,
  Page,
  Project,
  UxTest,
} from '@dua-upd/db';
import { connect, Types, disconnect } from 'mongoose';

// need to set a bigger timout because AA is super slow :)
// jest.setTimeout(30 * 60 * 1000);
//
//
// describe.skip('updateOverallMetrics', () => {
//   it('should work', async () => {
//     const insertedDocs = await updateOverallMetrics();
//     expect(insertedDocs).toBeDefined();
//   });
// });
//
// describe.skip('updatePages', () => {
//   it('should work', async () => {
//     const insertedDocs = await updatePages();
//     expect(insertedDocs).toBeDefined();
//   });
// });
