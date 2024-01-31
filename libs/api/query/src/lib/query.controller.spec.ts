import { Test } from '@nestjs/testing';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

describe('QueryController', () => {
  let controller: QueryController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [QueryService],
      controllers: [QueryController],
    }).compile();

    controller = module.get(QueryController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
