import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DbUpdateService } from '@dua-upd/db-update';
import { DataIntegrityService } from '@dua-upd/data-integrity';

export const EVERY_SUNDAY_AT_11PM = '0 0 23 * * 0' as const;

@Injectable()
export class UpdateService {
  private readonly logger = new Logger(UpdateService.name);
  private isRunning = false;

  constructor(
    private dataIntegrityService: DataIntegrityService,
    private dbUpdateService: DbUpdateService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10PM)
  async updateDatabase() {
    if (this.isRunning) {
      return;
    }

    try {
      this.isRunning = true;

      await this.dbUpdateService.updateAll();

      await this.dataIntegrityService.fillMissingData();
      await this.dataIntegrityService.cleanPageUrls();
    } catch (error) {
      this.logger.error(error);
    } finally {
      this.isRunning = false;
    }

    this.logger.log('Database updates completed.');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async runSAT() {
    if (this.isRunning) {
      return;
    }

    try {
      this.isRunning = true;

      await this.dbUpdateService.updateSAT();
    } catch (error) {
      this.logger.error(error);
    } finally {
      this.isRunning = false;
    }
  }
}
