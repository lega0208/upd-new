import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  updateOverallMetrics,
  updateUxData,
  updateCalldriverData,
  updatePages,
  updatePageMetrics,
} from '@cra-arc/db-update';
import { withRetry } from '@cra-arc/external-data';

@Injectable()
export class UpdateService {
  private readonly logger = new Logger(UpdateService.name);
  private isRunning = false;

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async updateDatabase() {
    if (this.isRunning) {
      return;
    }

    this.logger.log('Starting database updates...');
    this.isRunning = true;

    try {
      // Make sure not to run updates for the same data sources at
      //  the same time, or else we'll hit the rate limit
      await Promise.allSettled([
        withRetry(updateOverallMetrics, 4, 1000)().catch((err) =>
          this.logger.error('Error updating overall metrics', err)
        ),
        withRetry(updateUxData, 4, 1000)().catch((err) =>
          this.logger.error('Error updating UX data', err)
        ),
      ]);

      await Promise.allSettled([
        withRetry(updateCalldriverData, 4, 1000)().catch((err) =>
          this.logger.error('Error updating Calldrivers data', err)
        ),
        withRetry(updatePages, 4, 1000)().catch((err) =>
          this.logger.error('Error updating Page data', err)
        ),
        withRetry(updatePageMetrics, 4, 1000)().catch((err) =>
          this.logger.error('Error updating Page data', err)
        )
      ]);
    } catch (error) {
      this.logger.error(error);
    }

    this.isRunning = false;
    this.logger.log('Database updates completed.');
  }
}
