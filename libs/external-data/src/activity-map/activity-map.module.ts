import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule, DbService } from '@dua-upd/db';
import { BlobStorageModule } from '@dua-upd/blob-storage';
import { ActivityMapService } from './activity-map.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
    }),
    DbModule.forRoot(false),
    DbModule,
  ],
  providers: [ActivityMapService, DbService, BlobStorageModule],
  exports: [ActivityMapService],
})
export class ActivityMapModule {}
