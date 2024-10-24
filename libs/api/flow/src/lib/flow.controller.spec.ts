import { Test, TestingModule } from '@nestjs/testing';
import { FlowController } from './flow.controller';

describe('FlowController', () => {
  let controller: FlowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlowController],
    }).compile();

    controller = module.get<FlowController>(FlowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
