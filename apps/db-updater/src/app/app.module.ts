import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import {
  DataIntegrityModule,
  DataIntegrityService,
} from '@cra-arc/data-integrity';
import { UpdateService } from '../update-service/update.service';

@Module({
  imports: [ScheduleModule.forRoot(), DataIntegrityModule],
  providers: [UpdateService, DataIntegrityService],
})
export class AppModule {}
