import { DbService } from '@dua-upd/db';
import { DbUpdateService } from '@dua-upd/db-update';
import { Types } from 'mongoose';
import { logJson } from '@dua-upd/utils-common';

/*
 *  Export any function and it'll show up with the "run-script" command.
 *
 *  Every function is run with dependencies defined in run-script.command.ts
 *  Which, as of writing this comment, is the following:
 *
 *  const scriptDependencies: Parameters<DbScript> = [this.db, this.dbUpdateService]; (DbService and DbUpdateService)
*/

export const findDuplicatePageUrls = async (db: DbService) => {
  await db.getDuplicatedPages();
};

export const fixPagesFromAirtable = async (db: DbService, dbUpdate: DbUpdateService) => {
  console.time('fixPagesFromAirtable');
  // delete pages that need to be repopulated
  const objectIdsToDelete = [
    new Types.ObjectId('63867f9f2b89cb3c58edafdf'),
    new Types.ObjectId('63867f9f2b89cb3c58edafe0'),
  ]
  await db.collections.pages.deleteMany({ _id: { $in: objectIdsToDelete } });

  // update airtable data
  await dbUpdate.updateUxData();

  // consolidate duplicate pages
  await dbUpdate.consolidateDuplicatePages();

  // run validatePageRefs with filter for old ids
  await db.validatePageMetricsRefs({ page: { $in: objectIdsToDelete } });

  // clear pageVisits view and repopulate
  await db.views.pageVisits.clearAll()

  const dateRangesToRepopulate = [
    // yearly
    {
      start: new Date('2021-01-01'),
      end: new Date('2021-12-31'),
    },
    {
      start: new Date('2020-01-03'),
      end: new Date('2021-01-01'),
    },
    // quarterly
    {
      start: new Date('2022-07-01'),
      end: new Date('2022-09-30'),
    },
    {
      start: new Date('2022-04-01'),
      end: new Date('2022-07-01'),
    },
    // monthly
    {
      start: new Date('2022-11-01'),
      end: new Date('2022-11-30'),
    },
    {
      start: new Date('2022-09-27'),
      end: new Date('2022-10-26'),
    },
    // weekly
    {
      start: new Date('2022-12-11'),
      end: new Date('2022-12-17'),
    },
    {
      start: new Date('2022-12-04'),
      end: new Date('2022-12-10'),
    },
  ];

  for (const dateRange of dateRangesToRepopulate) {
    console.log('Repopulating date range:');
    logJson(dateRange);
    await db.views.pageVisits.getOrUpdate(dateRange);
  }

  console.timeEnd('fixPagesFromAirtable');
}
