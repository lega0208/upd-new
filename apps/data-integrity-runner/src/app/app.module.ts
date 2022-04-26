import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import {
  DataIntegrityModule,
  DataIntegrityService,
} from '@cra-arc/data-integrity';

@Module({
  imports: [DataIntegrityModule],
  providers: [AppService, DataIntegrityService],
})
export class AppModule {}
