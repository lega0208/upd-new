import { Module, ConsoleLogger } from '@nestjs/common';
import { DataIntegrityModule } from '@dua-upd/data-integrity';
import { DbService } from '@dua-upd/db';
import { DbUpdateModule } from '@dua-upd/db-update';
import { UpdateCommand, UpdateQuestions } from './update.command';
import { RepopulateCommand, RepopulateQuestions } from './repopulate.command';
import { RunScriptCommand } from './run-script.command';
import { PopulateCommand } from './populate.command';
import {
  PopulateCollectionPrompt,
  PopulateOverallPrompt,
  PopulatePagesPrompt,
  PopulateCollectionOptionsPrompt,
} from './populate.questions';

@Module({
  imports: [DataIntegrityModule, DbUpdateModule],
  providers: [
    ConsoleLogger,
    DbService,
    UpdateCommand,
    UpdateQuestions,
    RepopulateCommand,
    RepopulateQuestions,
    PopulateCommand,
    PopulateCollectionPrompt,
    PopulateOverallPrompt,
    PopulatePagesPrompt,
    PopulateCollectionOptionsPrompt,
    RunScriptCommand,
  ],
})
export class AppModule {}
