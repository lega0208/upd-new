import dayjs from 'dayjs';
import { AdobeAnalyticsClient, queryDateFormat } from '@cra-arc/external-data';
import { getOverallModel, Overall,  getDbConnectionString } from '@cra-arc/db';
import { connect, Model, Document } from 'mongoose';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc); // have to use UTC mode or else the output will be off by the timezone offset

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
    const client = new AdobeAnalyticsClient();

    const dateRange = {
      start: startTime.format(queryDateFormat),
      end: cutoffDate.format(queryDateFormat),
    };

    console.log(`\r\nFetching data from Adobe Analytics for overall_metrics for dates: ${dateRange.start} to ${dateRange.end}\r\n`);

    const newOverallMetrics: Overall[] = await client.getOverallMetrics(dateRange);

    const inserted = await overallMetricsModel.insertMany(newOverallMetrics);

    const datesInserted = inserted
      .map((i) => dayjs.utc(i['date']).format('YYYY-MM-DD'))
      .join(', ');

    console.log(`Successfully inserted overall metrics data for the following dates: ${datesInserted}`);

    return inserted;
  } else {
    console.log('Overall metrics already up-to-date.');
  }
}
