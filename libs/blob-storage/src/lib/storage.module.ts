import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlobStorageService } from './storage.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
    }),
  ],
  providers: [
    {
      provide: BlobStorageService.name,
      useFactory: async () =>
        await BlobStorageService.init(),
    },
  ],
  exports: [BlobStorageService.name],
})
export class BlobStorageModule {}
