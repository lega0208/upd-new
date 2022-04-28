import { Module } from '@nestjs/common';
import { DbModule } from '@cra-arc/db';
import { SearchAnalyticsClient } from '@cra-arc/external-data';
import { DbUpdateService } from './db-update.service';

@Module({
  imports: [DbModule],
  providers: [
    DbUpdateService,
    {
      provide: SearchAnalyticsClient.name,
      useValue: new SearchAnalyticsClient(),
    }
  ],
  exports: [DbUpdateService, SearchAnalyticsClient.name],
})
export class DbUpdateModule {}
