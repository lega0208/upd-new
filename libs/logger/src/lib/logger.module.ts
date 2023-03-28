import { DynamicModule, Module } from '@nestjs/common';
import { LoggerService, ServiceBlobLoggerConfig } from './logger.service';
import { BlobStorageModule } from '@dua-upd/blob-storage';

@Module({
  imports: [BlobStorageModule],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {
  static withBlobLogger(
    token: string,
    config: ServiceBlobLoggerConfig
  ): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: token,
          useFactory: (logger: LoggerService) =>
            logger.createBlobLogger(config),
          inject: [LoggerService],
        },
      ],
      exports: [token],
    };
  }
}
