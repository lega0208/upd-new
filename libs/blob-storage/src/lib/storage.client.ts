/**
 * Building blocks for an ORM-like wrapper for Azure Blob Storage
 *
 * Main purposes for the abstraction are:
 * - Abstract away lower-level details of configuring and interacting with Blob Storage
 * - Enforce a "registry" for Blob Containers and "Blob Models" to prevent overlap of container names and/or paths
 * - Expose the base functionality for upload/download/etc. as well as configuration and create
 *      an environment to extend and build on that functionality for specific use-cases
 */

import {
  BlobBeginCopyFromURLResponse,
  BlobClient as AzureBlobClient,
  BlobItem,
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
} from '@azure/storage-blob';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import { makeFileUploadProgressLogger } from './storage.utils';
import { prettyJson } from '@dua-upd/utils-common';

const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];

export type BlobType = 'block' | 'append';

/**
 * The base client for connecting to Blob storage. Wraps the official Azure client.
 * Used to initialize a client with the proper credentials and for creating
 * or managing container clients.
 */
export class StorageClient {
  private readonly baseClient: BlobServiceClient;

  constructor() {
    if (!connectionString) {
      throw Error('Azure Storage Connection string not found.');
    }

    try {
      this.baseClient =
        BlobServiceClient.fromConnectionString(connectionString);
    } catch (err) {
      throw Error('Failed to initialize Azure Storage client.', { cause: err });
    }
  }

  async container(containerName: string) {
    const containerClient = this.baseClient.getContainerClient(containerName);

    const response = await containerClient.createIfNotExists();

    if (response.errorCode && response.errorCode !== 'ContainerAlreadyExists') {
      throw Error(
        `Got errorCode ${
          response.errorCode
        } when running createIfNotExists() for container "${containerName}".\r\n${prettyJson(
          response
        )}`,
        { cause: response }
      );
    }

    return new StorageContainer(
      containerName,
      this.baseClient,
      containerClient
    );
  }

  async listContainers() {
    const containerNames = [];

    for await (const container of this.baseClient.listContainers()) {
      containerNames.push(container.name);
    }
    return containerNames;
  }
}

/**
 * Configuration for Blob "Archetypes":
 *
 * `path` is the container path that will be prefixed to the blob name, not including a path separator.
 * e.g. the path "logs" for the blob named "log1.txt" will have the full blobName "logs/log1.txt"
 */
export type BlobsConfig = {
  path: string;
  container: ContainerClient;
  overwrite?: boolean;
};

/**
 * Wrapper for Container clients. Used for creating instances of `ContainerBlobs`.
 *
 * @param containerName The name of the container. This will be the path separator in Blob URLs.
 * @param baseClient An instance of the base BlobServiceClient from the official Blob Storage SDK.
 * @param container The ContainerClient to wrap, from the official Blob Storage SDK.
 */
export class StorageContainer {
  constructor(
    private containerName: string,
    private baseClient: BlobServiceClient,
    private container: ContainerClient
  ) {}

  createBlobsClient(config: Omit<BlobsConfig, 'container'>): BlobModel {
    return new BlobModel({ ...config, container: this.container });
  }

  async listBlobs() {
    const blobs: BlobItem[] = [];

    for await (const blobPromise of this.container.listBlobsFlat()) {
      blobs.push(blobPromise);
    }

    return blobs;
  }
}

/**
 * An abstraction to separate different "types" of blobs that are contained
 * within the same container. Each blob "type" will be isolated to their
 * respective subdirectories/paths.
 *
 * It's primary purpose is to take a BlobsConfig and generate `BlobClient`s
 * using the provided config.
 */
export class BlobModel {
  constructor(private readonly config: BlobsConfig) {
    if (!this.config.path) {
      throw Error(
        'Expected a non-empty path in BlobsConfig, but none was provided.'
      );
    }
  }

  blob(blobName: string, blobType?: BlobType) {
    return new BlobClient(blobName, this.config, blobType);
  }
}

/**
 * A wrapper for `BlobClient` from the official Azure SDK.
 *
 * Prepends the configured "blob type" path and streamlines the functionality
 * to be easier to use and hiding unneeded functionality.
 */
export class BlobClient {
  private readonly path: string;
  private readonly container: ContainerClient;
  private overwrite = false;
  readonly blobType: BlobType;

  private readonly client: AzureBlobClient;
  private readonly name: string;
  public readonly filename: string;

  constructor(
    blobName: string,
    config: BlobsConfig,
    blobType: BlobType = 'block'
  ) {
    this.path = config.path;
    this.container = config.container;
    this.overwrite = config.overwrite;
    this.blobType = blobType;

    if (blobType === 'append') {
      this.client = this.container.getAppendBlobClient(
        `${config.path}/${blobName}`
      );
    } else {
      this.client = this.container.getBlockBlobClient(
        `${config.path}/${blobName}`
      );
    }

    this.name = this.client.name;
    this.filename = blobName;

    if (!this.path) {
      throw Error(
        'Expected a non-empty path in BlobsConfig, but none was provided.'
      );
    }
  }

  get url() {
    return this.client.url;
  }

  async getProperties() {
    return this.client.getProperties();
  }

  async getSize() {
    return (await this.client.getProperties()).contentLength;
  }

  async setCacheControl(cacheControl: string) {
    return await this.client.setHTTPHeaders({ blobCacheControl: cacheControl });
  }

  async sizesAreDifferent(fileSizeBytes: number) {
    if (!(await this.client.exists())) {
      return true;
    }

    const blobSize = await this.getSize();

    return fileSizeBytes !== blobSize;
  }

  async copyFromUrl(sourceUrl: string) {
    const blobExists = await this.client.exists();

    if (blobExists && !this.overwrite) {
      throw Error(
        `Error uploading blob: "${this.name}" already exists and options.overwrite = false`
      );
    }

    try {
      return await this.client.syncCopyFromURL(sourceUrl);
    } catch (err) {
      console.error(chalk.red('Error copying from url to storage:'));
      console.error(err.stack);
    }
  }

  async copyFromUrlIfDifferent(
    sourceUrl: string,
    fileSizeBytes: number
  ): Promise<BlobBeginCopyFromURLResponse | void> {
    if (await this.sizesAreDifferent(fileSizeBytes)) {
      console.log(`File is new or updated. Uploading: ${this.filename}`);
      return await this.copyFromUrl(sourceUrl);
    }
  }

  async downloadToFile(blobName: string, destinationFilePath: string) {
    if (!(await this.client.exists())) {
      throw Error(`The requested blob "${blobName}" does not exist`);
    }

    return await this.client.downloadToFile(destinationFilePath, 0, undefined, {
      onProgress: (event) => console.log(event),
    });
  }

  async uploadFromFile(filepathToUpload: string) {
    if (!(this.client instanceof BlockBlobClient)) {
      throw Error('copyFromUrl() can only be called on BlockBlobClients');
    }

    const blobExists = await this.client.exists();

    if (blobExists && !this.overwrite) {
      throw Error(
        `Error uploading blob: "${this.name}" already exists and overwrite = false`
      );
    }

    const fileBytesSize = (await stat(filepathToUpload)).size;
    const progressLogger = makeFileUploadProgressLogger(fileBytesSize);

    if (await this.sizesAreDifferent(fileBytesSize)) {
      try {
        return await this.client.uploadFile(filepathToUpload, {
          onProgress: progressLogger,
        });
      } catch (err) {
        console.error(chalk.red('Error uploading file to storage:'));
        console.error(err.stack);
      }
    }

    console.log('Files are the same. No changes made.');
  }

  async appendLines(lines: string[]) {
    // todo for AppendBlob
  }
}
