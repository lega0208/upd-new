import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { QueryService } from './query.service';

@Controller('query')
@UseInterceptors(CacheInterceptor)
export class QueryController {
  constructor(private queryService: QueryService) {}

  @Get()
  async getData(@Query() serializedQueries: { [key: string]: string }) {
    try {
      return await this.queryService.getData(serializedQueries);
    } catch (error) {
      throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
