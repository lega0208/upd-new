import { Module, ConsoleLogger } from '@nestjs/common';

import { DataIntegrityModule } from '@dua-upd/data-integrity';
import { DbUpdateModule } from '@dua-upd/db-update';
import { DbChecksCommand } from './db-repair.command';
import { UpdateCommand, UpdateQuestions } from './update.command';
import { RepopulateCommand, RepopulateQuestions } from './repopulate.command';

@Module({
  imports: [DataIntegrityModule, DbUpdateModule],
  providers: [
    ConsoleLogger,
    DbChecksCommand,
    UpdateCommand,
    UpdateQuestions,
    RepopulateCommand,
    RepopulateQuestions,
  ],
})
export class AppModule {}
