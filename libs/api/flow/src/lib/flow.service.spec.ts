import { Test, TestingModule } from '@nestjs/testing';
import { FlowService } from './flow.service';

describe('FlowService', () => {
  let service: FlowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlowService],
    }).compile();

    service = module.get<FlowService>(FlowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
