import { Command, CommandRunner, SubCommand } from 'nest-commander';
import { ConsoleLogger } from '@nestjs/common';
import { DataIntegrityService } from '@dua-upd/data-integrity';
import { UpdateCommand } from './update.command';
import { RepopulateCommand } from './repopulate.command';

@SubCommand({
  name: 'db-repair',
  description: 'Perform database checks and repair any issues found',
})
export class DbChecksCommand implements CommandRunner {
  constructor(
    private readonly logger: ConsoleLogger,
    private dataIntegrityService: DataIntegrityService
  ) {}

  async run(): Promise<void> {
    this.logger.log('Performing database checks and fixing any issues...');

    await this.dataIntegrityService.fillMissingData();
    await this.dataIntegrityService.cleanPageUrls();

    this.logger.log('Completed DB repairs.');

    return;
  }
}

@Command({
  name: 'run',
  arguments: '[task]',
  subCommands: [DbChecksCommand, UpdateCommand, RepopulateCommand],
  description: 'Run database scripts',
  options: {
    isDefault: true,
  }
})
export class AppCommand implements CommandRunner {
  async run(): Promise<void> {
    return;
  }
}
