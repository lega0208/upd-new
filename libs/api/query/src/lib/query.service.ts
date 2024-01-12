import { DbService } from '@dua-upd/db';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DbQuery } from './query.controller';

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

      const collectionModel = this.db.collections[collection] as Model<unknown>;

      results[key] = await collectionModel.find(filter, project).lean().exec();
    }

    return results;
  }
}
