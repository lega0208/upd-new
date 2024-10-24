import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class FlowCache {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

}
