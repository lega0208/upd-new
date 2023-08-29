import { Injectable } from '@nestjs/common';
import { BlobModel, StorageClient } from './storage.client';
import { CompressionAlgorithm } from '@dua-upd/node-utils';

export interface BlobDefinition {
  containerName: string;
  path: string;
  overwrite?: boolean;
  compression?: CompressionAlgorithm;
}

/*
 * Use this variable as the primary Blob Model "registry".
 * Once you add the model name here, you can let the type errors guide you.
 */
export const blobModels = [
  'project_attachments',
  'db_updates',
  'aa_raw',
  'feedback',
  'urls'
] as const;

export type BlobModels = typeof blobModels;
export type RegisteredBlobModel = BlobModels[number];

@Injectable()
export class BlobStorageService {
  private storageClient = new StorageClient();

  private readonly blobDefinitions: Record<RegisteredBlobModel, BlobDefinition> = {
    project_attachments: {
      path: 'project_attachments',
      containerName: 'documents',
      overwrite: true,
    },
    db_updates: {
      path: 'db_updates',
      containerName: 'logs',
    },
    aa_raw: {
      path: 'aa_raw',
      containerName: 'raw-data',
      compression: 'zstd',
    },
    feedback: {
      path: 'feedback',
      containerName: 'raw-data',
      compression: 'zstd',
    },
    urls: {
      path: 'urls',
      containerName: 'raw-data',
      compression: 'zstd',
    }
  } as const;

  readonly blobModels: Record<RegisteredBlobModel, BlobModel> = {
    db_updates: null,
    project_attachments: null,
    aa_raw: null,
    feedback: null,
    urls: null
  };

  private async configureBlobs(): Promise<BlobStorageService> {
    for (const [modelName, blobDefinition] of Object.entries(
      this.blobDefinitions
    )) {
      const container = await this.storageClient.container(
        blobDefinition.containerName
      );

      this.blobModels[modelName] = container.createBlobsClient({
        path: blobDefinition.path,
        overwrite: blobDefinition['overwrite'],
        compression: blobDefinition['compression'],
      });
    }

    return this;
  }

  static async init() {
    return await new BlobStorageService().configureBlobs();
  }
}
