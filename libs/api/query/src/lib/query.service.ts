import { DbService, Page } from '@dua-upd/db';
import { Injectable } from '@nestjs/common';
import { Model, Types, isValidObjectId } from 'mongoose';
import type { DbQuery } from '@dua-upd/types-common';
import dayjs from 'dayjs';

@Injectable()
export class QueryService {
  constructor(private db: DbService) {}

  async getData(serializedQueries: { [key: string]: string }) {
    const results: { [key: string]: unknown } = {};

    const queryDateRange = {
      start: dayjs().subtract(1, 'week').startOf('week').toDate(),
      end: dayjs().subtract(1, 'week').endOf('week').toDate(),
    };

    for (const key in serializedQueries) {
      const query: DbQuery[keyof DbQuery] = JSON.parse(
        atob(serializedQueries[key]),
      );

      const { collection, filter, project, sort } = query;

      if (isValidObjectId(filter['_id'])) {
        filter['_id'] = new Types.ObjectId(filter['_id']);
      }

      const collectionModel = this.db.collections[collection] as Model<unknown>;

      // large queries on this collection can cripple the db, so we'll limit the results like this for now
      const limit = collection === 'pageMetrics' ? 1000 : undefined;

      results[key] =
        collection === 'pages'
          ? await this.db.views.pageVisits.getVisitsWithPageData(
              queryDateRange,
              collectionModel as Model<Page>,
            )
          : await collectionModel
              .find(filter, project, { limit })
              .sort(sort)
              .lean()
              .exec();
    }

    return results;
  }
}
