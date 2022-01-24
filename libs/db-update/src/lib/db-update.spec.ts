import { updateOverallMetrics } from './db-update';

// need to set a bigger timout because AA is super slow :)
jest.setTimeout(60000);

describe('dbUpdate', () => {
  it('should work', async () => {
    const insertedDocs = await updateOverallMetrics();
    expect(insertedDocs).toBeDefined();
  });
});
