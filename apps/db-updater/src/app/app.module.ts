import { ConsoleLogger, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import {
  DataIntegrityModule,
  DataIntegrityService,
} from '@dua-upd/data-integrity';
import { DbUpdateModule } from '@dua-upd/db-update';
import { UpdateService } from '../update-service/update.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    DataIntegrityModule,
    DbUpdateModule,
  ],
  providers: [UpdateService, DataIntegrityService, ConsoleLogger],
})
export class AppModule {}
