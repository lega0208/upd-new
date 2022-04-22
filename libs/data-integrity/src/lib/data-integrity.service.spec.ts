import { Test } from '@nestjs/testing';
import { DataIntegrityService } from './data-integrity.service';

describe('DataIntegrityService', () => {
  let service: DataIntegrityService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DataIntegrityService],
    }).compile();

    service = module.get(DataIntegrityService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
