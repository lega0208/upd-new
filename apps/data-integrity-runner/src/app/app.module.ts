import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import {
  DataIntegrityModule,
} from '@cra-arc/data-integrity';

@Module({
  imports: [DataIntegrityModule],
  providers: [AppService],
})
export class AppModule {}
