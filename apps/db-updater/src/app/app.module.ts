import { ConsoleLogger, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import {
  DataIntegrityModule,
  DataIntegrityService,
} from '@cra-arc/data-integrity';
import { DbUpdateModule } from '@cra-arc/db-update';
import { UpdateService } from '../update-service/update.service';

@Module({
  imports: [ScheduleModule.forRoot(), DataIntegrityModule, DbUpdateModule],
  providers: [UpdateService, DataIntegrityService, ConsoleLogger],
})
export class AppModule {}
