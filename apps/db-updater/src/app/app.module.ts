import { ConsoleLogger, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { environment } from '../environments/environment';

import {
  DataIntegrityModule,
  DataIntegrityService,
} from '@dua-upd/data-integrity';
import { DbUpdateModule } from '@dua-upd/db-update';
import { UpdateService } from '../update-service/update.service';
import { ConfigModule } from '@nestjs/config';
import { DbModule, DbService } from '@dua-upd/db';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
    }),
    ScheduleModule.forRoot(),
    DataIntegrityModule,
    DbUpdateModule,
    DbModule.forRoot(environment.production),
  ],
  providers: [UpdateService, DataIntegrityService, ConsoleLogger],
})
export class AppModule {}
