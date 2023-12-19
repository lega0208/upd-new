import { Test, TestingModule } from '@nestjs/testing';
import { CustomReportsController } from './custom-reports.controller';

describe('CustomReportsController', () => {
  let controller: CustomReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomReportsController],
      providers: [],
    }).compile();

    controller = module.get<CustomReportsController>(CustomReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
