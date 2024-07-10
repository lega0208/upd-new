import { Test } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

describe('FeedbackController', () => {
  let controller: FeedbackController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FeedbackService],
      controllers: [FeedbackController],
    }).compile();

    controller = module.get(FeedbackController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
