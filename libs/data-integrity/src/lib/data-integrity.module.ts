import { ConsoleLogger, Module } from '@nestjs/common';
import { DbModule } from '@dua-upd/db';
import { DbUpdateModule } from '@dua-upd/db-update';
import { DataIntegrityService } from './data-integrity.service';
import { environment } from '../environments/environment';

@Module({
  imports: [DbModule, DbUpdateModule.register(environment.production)],
  providers: [DataIntegrityService, ConsoleLogger],
  exports: [DataIntegrityService, DbModule, DbUpdateModule],
})
export class DataIntegrityModule {}
