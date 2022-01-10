import { Test, TestingModule } from '@nestjs/testing';
import { OverallService } from './overall.service';

describe('OverallService', () => {
  let service: OverallService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OverallService],
    }).compile();

    service = module.get<OverallService>(OverallService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
