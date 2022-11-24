import { ConsoleLogger, Injectable } from '@nestjs/common';
import {
  SearchAnalyticsClient,
  SearchAnalyticsPageQueryOptions,
} from './index';
import { DateRange } from '../types';
import { Overall, PageMetrics } from '@dua-upd/db';
import { withRetry } from '../utils';

@Injectable()
export class GoogleSearchConsoleService {
  private readonly client = new SearchAnalyticsClient();

  constructor(private logger: ConsoleLogger) {}

  async getOverallMetrics(
    dateRange: DateRange,
    dataState: 'final' | 'all' = 'final',
    onComplete?: (results: Overall[]) => void
  ) {
    this.logger.log('Getting Overall GSC metrics for: ', dateRange);

    const metrics = (
      await this.client.getOverallMetrics(dateRange, dataState)
    ).filter((metrics) => Object.keys(metrics).length !== 0);

    onComplete?.(metrics);

    return metrics;
  }

  async getPageMetrics(
    dateRange: DateRange,
    options: {
      onComplete?: (results: Partial<PageMetrics>[]) => Promise<void>;
    } & SearchAnalyticsPageQueryOptions = {}
  ) {
    this.logger.log('Getting GSC Page metrics for: ', dateRange);

    return await this.client.getPageMetrics(dateRange, options);
  }

  get getPageMetricsWithRetry() {
    return withRetry(this.getPageMetrics.bind(this), 2, 520);
  }
}
