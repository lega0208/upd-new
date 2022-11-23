import { DbService } from '@dua-upd/db';

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
