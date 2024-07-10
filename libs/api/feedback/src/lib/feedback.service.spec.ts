import { Test } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FeedbackService],
    }).compile();

    service = module.get(FeedbackService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
