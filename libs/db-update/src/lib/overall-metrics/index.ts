import dayjs from 'dayjs';
import {
  AdobeAnalyticsClient,
  DateRange,
  queryDateFormat,
  SearchAnalyticsClient,
} from '@cra-arc/external-data';
import { getOverallModel, Overall, getDbConnectionString } from '@cra-arc/db';
import { connect, Model, Document, Types } from 'mongoose';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc); // have to use UTC mode or else the output will be off by the timezone offset

export async function fetchAndMergeOverallMetrics(dateRange: DateRange) {
  const adobeAnalyticsClient = new AdobeAnalyticsClient();
  const gscClient = new SearchAnalyticsClient();

  const [aaResults, gscResults] = await Promise.all([
    adobeAnalyticsClient.getOverallMetrics(dateRange),
    gscClient.getOverallMetrics(dateRange),
  ]);

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

export async function updateOverallMetrics() {
  await connect(getDbConnectionString());

  // Our Mongoose model, which lets us query the "overall_metrics" collection
  const overallMetricsModel: Model<Document<Overall>> = await getOverallModel();

  // get dates required for query
  const latestDateResults = await overallMetricsModel
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

    console.log(
      `\r\nFetching overall metrics from AA & GSC for dates: ${dateRange.start} to ${dateRange.end}\r\n`
    );

    const newOverallMetrics = await fetchAndMergeOverallMetrics(dateRange);

    // ids get automatically added by Mongoose
    const inserted = await overallMetricsModel.insertMany(newOverallMetrics);

    const datesInserted = inserted
      .map((i) => dayjs.utc(i['date']).format('YYYY-MM-DD'))
      .join(', ');

    console.log(
      `Successfully inserted overall metrics data for the following dates: ${datesInserted}`
    );

    return inserted;
  } else {
    console.log('Overall metrics already up-to-date.');
  }
}
