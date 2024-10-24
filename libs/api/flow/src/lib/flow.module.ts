import { Module, DynamicModule } from '@nestjs/common';
import { getAACredsPool } from '@dua-upd/node-utils';
import { FlowController } from './flow.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { AdobeAnalyticsClient } from '@dua-upd/api/custom-reports';
import { FlowService } from './flow.service';
import { hours } from '@dua-upd/utils-common';
import { FlowCache } from './flow.cache';
import { DbModule, DbService } from '@dua-upd/db';

@Module({})
export class FlowModule {
  static register(production = false): DynamicModule {
    return {
      module: FlowModule,
      imports: [CacheModule.register({ ttl: hours(3) }), DbModule],
      controllers: [FlowController],
      providers: [
        FlowService,
        FlowCache,
        {
          provide: AdobeAnalyticsClient,
          useFactory: async () => {
            const client = production
              ? new AdobeAnalyticsClient(await getAACredsPool())
              : new AdobeAnalyticsClient();

            await client.init();

            return client;
          },
        },
        DbService
      ],
      exports: [FlowService],
    };
  }
}
