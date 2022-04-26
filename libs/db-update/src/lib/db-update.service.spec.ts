import { Test, TestingModule } from '@nestjs/testing';
import { DbUpdateService } from './db-update.service';

describe('DbUpdateService', () => {
  let service: DbUpdateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DbUpdateService],
    }).compile();

    service = module.get<DbUpdateService>(DbUpdateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
