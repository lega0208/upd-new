import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ActivityMapService } from './activity-map.service';
import { DbModule, DbService } from '@dua-upd/db';
import { BlobStorageModule } from '@dua-upd/blob-storage';
import { AdobeAnalyticsService } from '../lib/adobe-analytics/adobe-analytics.service';
import { ConsoleLogger } from '@nestjs/common';
import { AdobeAnalyticsClient } from '../lib/adobe-analytics';

jest.setTimeout(900000000);

describe('ActivityMapServices', () => {
  let service: ActivityMapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
        }),
        DbModule.forRoot(false),
        DbModule,
        BlobStorageModule,
      ],
      providers: [
        ActivityMapService,
        AdobeAnalyticsService,
        ConsoleLogger,
        DbService,
        BlobStorageModule,
        {
          provide: AdobeAnalyticsClient.name,
          useValue: new AdobeAnalyticsClient(),
        },
      ],
      exports: [ActivityMapService],
    }).compile();

    service = module.get<ActivityMapService>(ActivityMapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get itemids', async () => {
    const results = await service.processActivityMap();
    console.log(results);
    return expect(results).toBeDefined();
  });

  // it('should get main', async () => {
  //   const results = await service.main();
  //   console.log(results);
  //   return expect(results).toBeDefined();
  // });
});
