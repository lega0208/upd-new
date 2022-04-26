import { Module } from '@nestjs/common';
import { DbModule } from '@cra-arc/db';
import { DbUpdateModule, DbUpdateService } from '@cra-arc/db-update';
import { DataIntegrityService } from './data-integrity.service';

@Module({
  imports: [DbModule, DbUpdateModule],
  providers: [DataIntegrityService, DbUpdateService],
  exports: [DataIntegrityService, DbModule, DbUpdateService],
})
export class DataIntegrityModule {}
