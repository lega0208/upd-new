import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleLogger } from '@nestjs/common';
import { BlobStorageModule, BlobStorageService } from '@dua-upd/blob-storage';
import { DbModule, DbService } from '@dua-upd/db';
import { ReadabilityService } from './readability.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
    }),
    DbModule,
    BlobStorageModule,
  ],
  providers: [ReadabilityService, ConsoleLogger, DbService, BlobStorageService],
  exports: [ReadabilityService, ConsoleLogger],
})
export class ReadabilityModule {}
