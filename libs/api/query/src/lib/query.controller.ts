import type { DbService } from '@dua-upd/db';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { FilterQuery, ProjectionType } from 'mongoose';
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
  ) {}

  @Get()
  async getData(@Query() serializedQueries: { [key: string]: string }) {
    const results = await this.queryService.getData(serializedQueries);

    return results;
  }
}
