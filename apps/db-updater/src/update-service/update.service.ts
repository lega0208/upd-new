import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DbUpdateService } from '@dua-upd/db-update';
import { environment } from '../environments/environment';
import { DataIntegrityService } from '@dua-upd/data-integrity';

export declare enum CronCustomExpression {
  EVERY_SUNDAY_AT_10PM = '0 0 22 * * 0',
}

@Injectable()
export class UpdateService {
  private readonly logger = new Logger(UpdateService.name);
  private isRunning = false;

  constructor(
    private dataIntegrityService: DataIntegrityService,
    private dbUpdateService: DbUpdateService
  ) {}

  @Cron(
    environment.production
      ? CronExpression.EVERY_DAY_AT_10PM
      : CronExpression.EVERY_MINUTE
  )
  async updateDatabase() {
    if (this.isRunning) {
      return;
    }

    try {
      this.isRunning = true;

      await this.dbUpdateService.updateAll();

      await this.dataIntegrityService.fillMissingData();
      await this.dataIntegrityService.cleanPageUrls();
      
      if (new Date().getDay() === 0) {
        await this.dbUpdateService.updateSAT();
      }
    } catch (error) {
      this.logger.error(error);
    }

    this.isRunning = false;
    this.logger.log('Database updates completed.');
  }
}
