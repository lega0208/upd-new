import { Injectable } from '@nestjs/common';
import { BlobModel, StorageClient } from './storage.client';

export interface BlobDefinition {
  containerName: string;
  path: string;
  overwrite?: boolean;
}

@Injectable()
export class BlobStorageService {
  private storageClient = new StorageClient();

  readonly blobDefinitions = {
    project_attachments: {
      path: 'project_attachments',
      containerName: 'documents',
      overwrite: true,
    },
    db_updates: {
      path: 'db-updates',
      containerName: 'logs',
    },
  } as const;

  readonly blobModels: Record<
    keyof BlobStorageService['blobDefinitions'],
    BlobModel
  > = {
    db_updates: null,
    project_attachments: null,
  };

  private async configureBlobs() {
    for (const [modelName, blobDefinition] of Object.entries(
      this.blobDefinitions
    )) {
      const container = await this.storageClient.container(
        blobDefinition.containerName
      );

      this.blobModels[modelName] = container.createBlobsClient({
        path: blobDefinition.path,
        overwrite: blobDefinition['overwrite'],
      });
    }
    console.log(this.blobModels)

    return this;
  }

  static async init() {
    return await new BlobStorageService().configureBlobs();
  }
}
