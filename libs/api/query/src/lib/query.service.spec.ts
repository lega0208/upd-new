import { Test } from '@nestjs/testing';
import { QueryService } from './query.service';

describe('QueryService', () => {
  let service: QueryService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [QueryService],
    }).compile();

    service = module.get(QueryService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
