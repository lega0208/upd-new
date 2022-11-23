import { Test, TestingModule } from '@nestjs/testing';
import { AdobeAnalyticsService } from './adobe-analytics.service';

describe('AdobeAnalyticsService', () => {
  let service: AdobeAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdobeAnalyticsService],
    }).compile();

    service = module.get<AdobeAnalyticsService>(AdobeAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
