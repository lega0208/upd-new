import { Test, TestingModule } from '@nestjs/testing';
import { OverallController } from './overall.controller';
import { OverallService } from './overall.service';

describe('OverallController', () => {
  let controller: OverallController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OverallController],
      providers: [OverallService],
    }).compile();

    controller = module.get<OverallController>(OverallController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
