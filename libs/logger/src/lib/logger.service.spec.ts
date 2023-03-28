import { Test } from '@nestjs/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
