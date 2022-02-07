import { updateOverallMetrics } from './overall-metrics';
import { updatePages } from './pages';

// need to set a bigger timout because AA is super slow :)
jest.setTimeout(900000);

describe('updateOverallMetrics', () => {
  it('should work', async () => {
    const insertedDocs = await updateOverallMetrics();
    expect(insertedDocs).toBeDefined();
  });
});

describe('updatePages', () => {
  it('should work', async () => {
    const insertedDocs = await updatePages();
    expect(insertedDocs).toBeDefined();
  });
});
