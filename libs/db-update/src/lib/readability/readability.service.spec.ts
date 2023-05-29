import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ReadabilityService } from './readability.service';
import { DbModule, DbService } from '@dua-upd/db';

jest.setTimeout(900000000);

describe('ReadabilityService', () => {
  let service: ReadabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
        }),
        DbModule.forRoot(false),
        DbModule,
      ],
      providers: [ReadabilityService, DbService],
      exports: [ReadabilityService],
    }).compile();

    service = module.get<ReadabilityService>(ReadabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get pages', async () => {
    const results = await service.getPages();
    console.log(results);
    return expect(results).toBeDefined();
  });

  it('should get main', async () => {
    const results = await service.main();
    console.log(results);
    return expect(results).toBeDefined();
  });
});
