import { Module, ConsoleLogger } from '@nestjs/common';

import { DataIntegrityModule } from '@cra-arc/data-integrity';
import { AppCommand, DbChecksCommand } from './app.command';
import { UpdateCommand, UpdateQuestions } from './update.command';
import { DbUpdateModule } from '@cra-arc/db-update';
import { RepopulateCommand, RepopulateQuestions } from './repopulate.command';

@Module({
  imports: [DataIntegrityModule, DbUpdateModule],
  providers: [
    AppCommand,
    ConsoleLogger,
    DbChecksCommand,
    UpdateCommand,
    UpdateQuestions,
    RepopulateCommand,
    RepopulateQuestions,
  ],
})
export class AppModule {}
