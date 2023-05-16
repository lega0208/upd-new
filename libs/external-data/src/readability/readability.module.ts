import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReadabilityService } from './readability.service';
import { ConsoleLogger } from '@nestjs/common';
import { DbModule, DbService } from '@dua-upd/db';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
    }),
    DbModule,
  ],
  providers: [ReadabilityService, ConsoleLogger, DbService],
  exports: [ReadabilityService, ConsoleLogger],
})
export class ReadabilityModule {}
