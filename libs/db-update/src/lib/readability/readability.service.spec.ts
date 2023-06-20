import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ReadabilityService } from './readability.service';
import { DbModule, DbService } from '@dua-upd/db';

jest.setTimeout(5000);

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

  it('should assess readability', async () => {
    const fakeContent = `
      <html>
      <body>
        <main>
        <h1>a title</h1>
        <p>a paragraph</p>
        </main>
      </body>
      </html>
      `;

    const results = await service.calculateReadability(fakeContent, 'fr');

    console.log(results);

    return expect(results).toBeDefined();
  });
});
