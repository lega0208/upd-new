import { Module, ConsoleLogger } from '@nestjs/common';

import { DataIntegrityModule } from '@cra-arc/data-integrity';
import { AppCommand, DbChecksCommand } from './app.command';
import { UpdateCommand, UpdateQuestions } from './update.command';
import { DbUpdateModule } from '@cra-arc/db-update';

@Module({
  imports: [DataIntegrityModule, DbUpdateModule],
  providers: [
    AppCommand,
    ConsoleLogger,
    DbChecksCommand,
    UpdateCommand,
    UpdateQuestions,
  ],
})
export class AppModule {}
