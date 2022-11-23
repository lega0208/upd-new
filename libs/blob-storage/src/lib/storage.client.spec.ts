import { storageClient } from './storage.client';

describe('blobStorage', () => {
  it('should work', () => {
    expect(storageClient()).toEqual('blob-storage');
  });
});
