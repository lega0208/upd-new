import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { UpdateService } from '../update-service/update.service';
import { DataIntegrityModule } from '@cra-arc/data-integrity';

@Module({
  imports: [ScheduleModule.forRoot(), DataIntegrityModule],
  providers: [UpdateService],
})
export class AppModule {}
