import { Test, TestingModule } from '@nestjs/testing';
import { GoogleSearchConsoleService } from './google-search-console.service';

describe('GoogleSearchConsoleService', () => {
  let service: GoogleSearchConsoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleSearchConsoleService],
    }).compile();

    service = module.get<GoogleSearchConsoleService>(
      GoogleSearchConsoleService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
