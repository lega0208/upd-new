import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { updateOverallMetrics } from '@cra-arc/db-update';
import { withRetry } from '@cra-arc/external-data'

@Injectable()
export class UpdateService {
  private readonly logger = new Logger(UpdateService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async updateDatabase() {
    this.logger.log('Starting database updates...');

    try {
      const results = await Promise.allSettled([
        withRetry(updateOverallMetrics, 4, 1000)().catch((err) =>
          this.logger.error('Failed to update overall metrics', err)
        ),
      ]);

      for (const result of results) {
        if (result.status === 'rejected') {
          this.logger.error(`Error updating database: ${result.reason}`);
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
