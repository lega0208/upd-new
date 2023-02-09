import { DbService } from '@dua-upd/db';
import { DbUpdateService } from '@dua-upd/db-update';

export const recalculateViews = async (db: DbService, updateService: DbUpdateService) => {
  return await updateService.recalculateViews();
}

export const addMissingPageMetricsRefs = async (db: DbService) => {
  await db.addMissingAirtableRefsToPageMetrics();
}
