import { ConsoleLogger, Logger, Module } from '@nestjs/common';
import { DbModule } from '@dua-upd/db';
import { DbUpdateModule, DbUpdateService } from '@dua-upd/db-update';
import { DataIntegrityService } from './data-integrity.service';

@Module({
  imports: [DbModule, DbUpdateModule],
  providers: [DataIntegrityService, DbUpdateService, ConsoleLogger],
  exports: [DataIntegrityService, DbModule, DbUpdateModule, DbUpdateService],
})
export class DataIntegrityModule {}
