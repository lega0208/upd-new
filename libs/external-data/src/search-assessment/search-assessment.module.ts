import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AirtableClient } from '../lib/airtable';
import { SearchAssessmentService } from './search-assessment.service';
import { ConsoleLogger } from '@nestjs/common';
import { DbModule, DbService } from '@dua-upd/db';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.DOTENV_CONFIG_PATH || '.env',
    }),
    DbModule,
  ],
  providers: [
    {
      provide: AirtableClient.name,
      useValue: new AirtableClient(),
    },
    SearchAssessmentService,
    ConsoleLogger,
    DbService,
  ],
  exports: [AirtableClient.name, SearchAssessmentService, ConsoleLogger],
})
export class SearchAssessmentModule {}
