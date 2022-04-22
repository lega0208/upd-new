import { Module } from '@nestjs/common';
import { DbModule } from '@cra-arc/db';
import { DataIntegrityService } from './data-integrity.service';

@Module({
  imports: [DbModule],
  providers: [DataIntegrityService],
  exports: [DataIntegrityService],
})
export class DataIntegrityModule {}
