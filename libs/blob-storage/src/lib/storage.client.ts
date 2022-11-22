import {
  BlobItem,
  BlobServiceClient,
  ContainerClient,
} from '@azure/storage-blob';
import chalk from 'chalk';
import { logJson } from '@dua-upd/utils-common';

const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];

export class StorageClient {
  client: BlobServiceClient;
  dbSnapshot: ContainerClient;

  constructor() {
    if (!connectionString) {
      throw Error('Azure Storage Connection string not found');
    }

    try {
      this.client = BlobServiceClient.fromConnectionString(connectionString);
      this.dbSnapshot = this.client.getContainerClient('db-snapshot');
    } catch (err) {
      console.error(chalk.red('Failed to initialize Azure Storage client'));
      console.error(chalk.red(err));

      throw Error(err.stack);
    }
  }

  async ensureDbSnapshotContainer() {
    try {
      console.log('ensuring dbSnapshotContainer-- name:');
      console.log(this.dbSnapshot.containerName);
      return await this.dbSnapshot.createIfNotExists();
    } catch (err) {
      console.error(
        chalk.red(
          'Error occurred while calling this.dbSnapshot.createIfNotExists()'
        )
      );
      console.error(chalk.red(err));
    }
  }

  async listBlobs() {
    const blobs: BlobItem[] = [];

    for await (const blobPromise of this.dbSnapshot.listBlobsFlat()) {
      blobs.push(blobPromise);
    }

    const blobNames = blobs.map((blob) => blob.name);

    logJson(blobNames);

    return blobs;
  }

  async downloadBlob(blobName: string, destinationFilePath: string) {
    const blobClient = this.dbSnapshot.getBlobClient(blobName);

    if (!(await blobClient.exists())) {
      throw Error(`The requested dbSnapshot blob does not exist: ${blobName}`);
    }

    return await blobClient.downloadToFile(destinationFilePath, 0, undefined, {
      onProgress: (event) => console.log(event),
    });
  }
}

export const getStorageClient = async () => {
  const storageClient = new StorageClient();
  await storageClient.ensureDbSnapshotContainer();

  return storageClient;
};
