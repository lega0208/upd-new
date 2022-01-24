import { Test, TestingModule } from '@nestjs/testing';
import { UpdateService } from './update.service';
import { withResilience } from '../../../../libs/external-data/src/lib/utils';

describe('UpdateService', () => {
  let service: UpdateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateService],
    }).compile();

    service = module.get<UpdateService>(UpdateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

});

describe('withResilience', () => {
  it('Should retry on failure', async () => {
    let numAttempts = 0;

    const fn = () => {
      numAttempts++;

      return Promise.reject(new Error('Failed'));
    };

    const testFunc = withResilience(fn, { retries: 3 });

    await expect(async () => await testFunc()).rejects.toThrow();
    expect(numAttempts).toBe(4);
  });

  it('Should throw error on timeout, and retry', async () => {
    let numAttempts = 0;

    const fn = () => {
      numAttempts++;

      return new Promise((resolve) => setTimeout(() => resolve('Success?'), 1000));
    };

    const testFunc = withResilience(fn, { retries: 2, timeout: 500 });

    await expect(async () => await testFunc()).rejects.toThrow();
    expect(numAttempts).toBe(3);
  });
});
