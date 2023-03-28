import { ConsoleLogger, Module } from '@nestjs/common';
import { DbModule } from '@dua-upd/db';
import { DbUpdateModule } from '@dua-upd/db-update';
import { DataIntegrityService } from './data-integrity.service';

@Module({
  imports: [DbModule, DbUpdateModule],
  providers: [DataIntegrityService, ConsoleLogger],
  exports: [DataIntegrityService, DbModule, DbUpdateModule],
})
export class DataIntegrityModule {}
