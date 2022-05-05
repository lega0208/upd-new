import { ConsoleLogger, Logger, Module } from '@nestjs/common';
import { DbModule } from '@cra-arc/db';
import { DbUpdateModule, DbUpdateService } from '@cra-arc/db-update';
import { DataIntegrityService } from './data-integrity.service';

@Module({
  imports: [DbModule, DbUpdateModule],
  providers: [DataIntegrityService, DbUpdateService, ConsoleLogger],
  exports: [DataIntegrityService, DbModule, DbUpdateModule, DbUpdateService],
})
export class DataIntegrityModule {}
