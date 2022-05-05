import { Test, TestingModule } from '@nestjs/testing';
import { AirtableService } from './airtable.service';

describe('AirtableService', () => {
  let service: AirtableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AirtableService],
    }).compile();

    service = module.get<AirtableService>(AirtableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
