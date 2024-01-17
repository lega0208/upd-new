import { DbService } from '@dua-upd/db';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import type { DbQuery } from '@dua-upd/types-common';

@Injectable()
export class QueryService {
  constructor(private db: DbService) {}

  async getData(serializedQueries: { [key: string]: string }) {
    const results: { [key: string]: unknown } = {};

    for (const key in serializedQueries) {
      const query: DbQuery[keyof DbQuery] = JSON.parse(
        atob(serializedQueries[key]),
      );

      const { collection, filter, project } = query;

      if ( filter['_id'] ) {
        filter['_id'] = new Types.ObjectId(filter['_id']);
      }

      const collectionModel = this.db.collections[collection] as Model<unknown>;

      // large queries on this collection can cripple the db, so we'll limit the results like this for now
      const limit = collection === 'pageMetrics' ? 1000 : undefined;

      results[key] = await collectionModel
        .find(filter, project, { limit })
        .lean()
        .exec();
    }

    return results;
  }
}
