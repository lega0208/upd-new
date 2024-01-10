import type { DbService } from '@dua-upd/db';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { FilterQuery, Model, ProjectionType } from 'mongoose';
import { QueryService } from './query.service';

export type CollectionKeys = keyof DbService['collections'];

export type DbQuery = {
  [key: string]: {
    collection: CollectionKeys;
    filter: FilterQuery<unknown>;
    project?: ProjectionType<unknown>;
  };
};

@Controller('query')
@UseInterceptors(CacheInterceptor)
export class QueryController {
  constructor(
    private queryService: QueryService,
    private db: DbService,
  ) {}

  @Get()
  async getData(@Query() serializedQueries: { [key: string]: string }) {
    const results: { [key: string]: unknown } = {};

    for (const key in serializedQueries) {
      const query: DbQuery[keyof DbQuery] = JSON.parse(atob(serializedQueries[key]));

      const { collection, filter, project } = query;

      const collectionModel = this.db.collections[collection] as Model<unknown>;

      results[key] = await collectionModel.find(filter, project).lean().exec();
    }

    return results;
  }
}
