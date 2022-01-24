export * from './lib/db.module';
export * from './lib/db.connection';
export * from './lib/db.schemas';

import mongoose, { Model } from 'mongoose';
import { Overall, OverallSchema, Page, PageSchema } from './lib/db.schemas';

export function getOverallModel(): Model<mongoose.Document<Overall>> {
  return mongoose.model(Overall.name, OverallSchema);
}

export function getPageModel() {
  return mongoose.model(Page.name, PageSchema);
}
