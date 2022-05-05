import { Test, TestingModule } from '@nestjs/testing';
import { OverallMetricsService } from './overall-metrics.service';

describe('OverallMetricsService', () => {
  let service: OverallMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OverallMetricsService],
    }).compile();

    service = module.get<OverallMetricsService>(OverallMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
