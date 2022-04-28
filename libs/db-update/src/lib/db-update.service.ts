import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Overall,
  OverallDocument,
  Page,
  PageMetrics,
} from '@cra-arc/types-common';
import type { PageDocument, PageMetricsModel } from '@cra-arc/types-common';
import { queryDateFormat, SearchAnalyticsClient } from '@cra-arc/external-data';
import { wait } from '@cra-arc/utils-common';
import { fetchAndMergePageMetrics } from './pages-metrics';

dayjs.extend(utc);

@Injectable()
export class DbUpdateService {
  constructor(
    @Inject(SearchAnalyticsClient.name)
    private gscClient: SearchAnalyticsClient,
    @InjectModel(Overall.name) private overallModel: Model<OverallDocument>,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel
  ) {}

  async getSingleDayMetrics(date: string) {
    const dateRange = {
      start: dayjs(date).utc(false).startOf('day').format(queryDateFormat),
      end: dayjs.utc(date).add(1, 'day').format(queryDateFormat),
    };
    console.log(`Getting metrics for ${dateRange.start} to ${dateRange.end}`);

    return (await fetchAndMergePageMetrics(dateRange)) as PageMetrics[];
  }

  async getPageMetrics(dates: string[]): Promise<PageMetrics[]> {
    const promises = [];

    for (const date of dates) {
      promises.push(this.getSingleDayMetrics(date));
      await wait(501);
    }

    return (await Promise.all(promises)).flat();
  }

  async upsertPageMetrics(pageMetrics: PageMetrics[]) {
    const bulkInsertOps = [];

    for (const pageMetric of pageMetrics) {
      const pageMetricNoId = { ...pageMetric };
      delete pageMetricNoId._id;

      bulkInsertOps.push({
        updateOne: {
          filter: {
            url: pageMetric.url,
            date: pageMetric.date,
          },
          update: {
            $setOnInsert: {
              _id: pageMetric._id,
            },
            $set: pageMetricNoId,
          },
          upsert: true,
        },
      });
    }

    return this.pageMetricsModel.bulkWrite(bulkInsertOps);
  }

  async upsertOverallGscMetrics(dates: Date[]) {
    const bulkInsertOps = [];

    const results = (
      await Promise.all(
        dates.map((date) => this.gscClient.getOverallMetrics(date))
      )
    ).flat();

    for (const result of results) {
      bulkInsertOps.push({
        updateOne: {
          filter: {
            date: result.date,
          },
          update: {
            $set: result,
          },
        },
      });
    }

    return this.overallModel.bulkWrite(bulkInsertOps);
  }
}
