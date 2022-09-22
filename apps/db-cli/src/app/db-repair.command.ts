import { Command, CommandRunner } from 'nest-commander';
import { ConsoleLogger } from '@nestjs/common';
import { DataIntegrityService } from '@dua-upd/data-integrity';

@Command({
  name: 'db-repair',
  description: 'Perform database checks and repair any issues found',
})
export class DbChecksCommand extends CommandRunner {
  constructor(
    private readonly logger: ConsoleLogger,
    private dataIntegrityService: DataIntegrityService
  ) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('Performing database checks and fixing any issues...');

    await this.dataIntegrityService.fillMissingData();
    await this.dataIntegrityService.cleanPageUrls();

    this.logger.log('Completed DB repairs.');

    return;
  }
}
