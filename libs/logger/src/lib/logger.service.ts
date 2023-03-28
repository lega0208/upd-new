import { Inject, Injectable, LogLevel, Scope } from '@nestjs/common';
import { CustomLogger } from './logger.custom';
import { BlobStorageService, RegisteredBlobModel } from '@dua-upd/blob-storage';
import { BlobLogger, BlobLoggerConfig } from './logger.client';

export interface ServiceBlobLoggerConfig extends BlobLoggerConfig {
  blobModel: RegisteredBlobModel;
}
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private readonly logger = new CustomLogger();

  constructor(
    @Inject(BlobStorageService.name) private storage: BlobStorageService
  ) {}

  createBlobLogger(blobLoggerConfig: ServiceBlobLoggerConfig) {
    const blobModel =
      this.storage.blobModels[
        blobLoggerConfig.blobModel as RegisteredBlobModel
      ];

    return new BlobLogger({
      ...blobLoggerConfig,
      blobModel,
    });
  }

  setContext(context: string) {
    this.logger.setContext(context);
  }

  log(message: string, ...text: unknown[]) {
    this.logger.log(message, ...text);
  }

  info(message: string, ...text: unknown[]) {
    this.logger.info(message, ...text);
  }

  accent(message: string, ...text: unknown[]) {
    this.logger.accent(message, ...text);
  }

  error(message: unknown, stack?: string) {
    this.logger.error(message, stack);
  }

  warn(message: string, ...text: unknown[]) {
    this.logger.warn(message, ...text);
  }
}
