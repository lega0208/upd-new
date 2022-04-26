import { Module } from '@nestjs/common';
import { DbUpdateService } from './db-update.service';
import { DbModule } from '@cra-arc/db';

@Module({
  imports: [DbModule],
  providers: [DbUpdateService],
  exports: [DbUpdateService],
})
export class DbUpdateModule {}
