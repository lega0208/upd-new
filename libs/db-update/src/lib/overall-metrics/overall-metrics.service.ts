import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import {
  AdobeAnalyticsClient,
  DateRange,
  queryDateFormat,
  SearchAnalyticsClient,
} from '@dua-upd/external-data';
import { InjectModel } from '@nestjs/mongoose';
import { Overall, OverallDocument } from '@dua-upd/db';
import { Model, Types } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

@Injectable()
export class OverallMetricsService {
  constructor(
    @Inject(AdobeAnalyticsClient.name)
    private adobeAnalyticsClient: AdobeAnalyticsClient,
    @Inject(SearchAnalyticsClient.name)
    private gscClient: SearchAnalyticsClient,
    private logger: ConsoleLogger,
    @InjectModel(Overall.name, 'defaultConnection')
    private overallMetricsModel: Model<OverallDocument>
  ) {}

  // todo: refactor to be able to use it for data-integrity & elsewhere
  async updateOverallMetrics() {
    // get dates required for query
    const latestDateResults = await this.overallMetricsModel
      .find({}, { date: 1 })
      .sort({ date: -1 })
      .limit(1)
      .exec();

    // get the most recent date from the DB, and set the start date to the next day
    const latestDate = dayjs.utc(latestDateResults[0]['date']);
    const startTime = latestDate.add(1, 'day');

    // collect data up to the start of the current day/end of the previous day
    const cutoffDate = dayjs.utc().subtract(1, 'day').endOf('day');

    // fetch data if our db isn't up-to-date
    if (startTime.isBefore(cutoffDate)) {
      const dateRange = {
        start: startTime.format(queryDateFormat),
        end: cutoffDate.format(queryDateFormat),
      };

      this.logger.log(
        `\r\nFetching overall metrics from AA & GSC for dates: ${dateRange.start} to ${dateRange.end}\r\n`
      );

      const newOverallMetrics = await this.fetchAndMergeOverallMetrics(
        dateRange
      );
      this.logger.log(
        `\r\nInserting ${newOverallMetrics.length} new overall metrics documents\r\n`
      );

      const inserted = await this.overallMetricsModel.insertMany(
        newOverallMetrics
      );

      const datesInserted = inserted
        .map((doc) => dayjs.utc(doc['date']).format('YYYY-MM-DD'))
        .join(', ');

      this.logger.log(
        `Successfully inserted overall metrics data for the following dates: ${datesInserted}`
      );

      return inserted;
    } else {
      this.logger.log('Overall metrics already up-to-date.');
    }
  }
  async fetchAndMergeOverallMetrics(dateRange: DateRange) {
    const [aaResults, gscResults] = await Promise.all([
      this.adobeAnalyticsClient.getOverallMetrics(dateRange),
      this.gscClient.getOverallMetrics(dateRange, 'all'),
    ]);

    this.logger.log('Finished fetching data from AA & GSC');

    return aaResults.map((result) => {
      const gscResult = gscResults.find(
        (gscResult) => gscResult.date.getTime() === result.date.getTime()
      );

      return {
        _id: new Types.ObjectId(),
        ...result,
        ...gscResult,
      };
    });
  }
}
