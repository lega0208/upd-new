import { Module } from '@nestjs/common';
import { DataIntegrityService } from './data-integrity.service';

@Module({
  controllers: [],
  providers: [DataIntegrityService],
  exports: [DataIntegrityService],
})
export class DataIntegrityModule {}
