import { Module, ConsoleLogger } from '@nestjs/common';
import { DataIntegrityModule } from '@dua-upd/data-integrity';
import { DbModule, DbService } from '@dua-upd/db';
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
import { environment } from '../environments/environment';

@Module({
  imports: [
    DataIntegrityModule,
    DbUpdateModule,
    DbModule.forRoot(environment.production),
  ],
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
