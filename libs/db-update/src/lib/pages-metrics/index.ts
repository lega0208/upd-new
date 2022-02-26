import dayjs from 'dayjs';
import {
  AdobeAnalyticsClient,
  DateRange,
  queryDateFormat,
  SearchAnalyticsClient,
} from '@cra-arc/external-data';
import {
  getDbConnectionString,
  PageMetrics,
  getPageMetricsModel,
} from '@cra-arc/db';
import { connect, Model, Document, Types } from 'mongoose';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc); // have to use UTC mode or else the output will be off by the timezone offset

export async function fetchAndMergePageMetrics(dateRange: DateRange) {
  const adobeAnalyticsClient = new AdobeAnalyticsClient();
  const gscClient = new SearchAnalyticsClient();

  const [aaResults, gscResults] = await Promise.all([
    adobeAnalyticsClient.getPageMetrics(dateRange),
    gscClient.getPageMetrics(dateRange),
  ]);

  // because there'll be potentially tens of thousands of results,
  //   we'll chunk them by date to merge them more efficiently
  const aaDates = aaResults.map((dateResults) => dateResults[0]?.date);
  const gscDates = gscResults.map((dateResults) => dateResults[0]?.date);

  console.log(`Found ${aaDates.length} dates in Adobe Analytics`);
  console.log(`Found ${gscDates.length} dates in Google Search Console`);

  if (aaDates.length !== gscDates.length) {
    console.error(
      'Mismatched dates between Adobe Analytics and Google Search Console'
    );
  }

  return aaDates
    .map((date) => {
      const aaDateResults = aaResults.find(
        (dateResults) => dateResults[0]?.date.getTime() === date.getTime()
      );
      const gscDateResults =
        gscResults.find(
          (dateResults) => dateResults[0]?.date.getTime() === date.getTime()
        ) || [];

      return aaDateResults.map((aaDateResults) => {
        const gscResults = gscDateResults.find(
          (gscDateResult) => gscDateResult.url === aaDateResults.url
        );

        return {
          _id: new Types.ObjectId(),
          ...aaDateResults,
          ...(gscResults || {}),
        };
      });
    })
    .reduce(
      (finalResults, dateResults) => finalResults.concat(dateResults),
      []
    );
}

export async function updatePageMetrics() {
  await connect(getDbConnectionString());

  // Our Mongoose model, which lets us query the "pages_metrics" collection
  const pageMetricsModel: Model<Document<PageMetrics>> =
    await getPageMetricsModel();

  // get dates required for query
  const latestDateResults = await pageMetricsModel
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
      `\r\nFetching page metrics from AA & GSC for dates: ${dateRange.start} to ${dateRange.end}\r\n`
    );

    const newPageMetrics = await fetchAndMergePageMetrics(dateRange);

    const inserted = await pageMetricsModel.insertMany(newPageMetrics);

    const datesInserted = inserted
      .map((i) => dayjs.utc(i['date']).format('YYYY-MM-DD'))
      .join(', ');

    console.log(
      `Successfully inserted page metrics data for the following dates: ${datesInserted}`
    );

    return inserted;
  } else {
    console.log('Page metrics already up-to-date.');
  }
}

// For merging AA page metrics data with pre-existing GSC data, or inserting if no match is found
async function upsertAAPageMetrics(pageMetrics: PageMetrics[]) {
  const pageMetricsModel = getPageMetricsModel();

  await Promise.all(
    pageMetrics.map((metrics) =>
      pageMetricsModel
        .findOneAndUpdate(
          { url: metrics.url, date: metrics.date },
          metrics,
          { upsert: true, new: true, lean: true, rawResults: true }
        )
        .exec()
    )
  );

  console.log(
    `Successfully upserted page metrics for ${pageMetrics.length} pages`
  );

  return pageMetrics;
}

export async function addAAPageMetrics(dateRange: DateRange) {
  await connect(getDbConnectionString());

  const adobeAnalyticsClient = new AdobeAnalyticsClient();

  return await adobeAnalyticsClient.getPageMetrics(dateRange, {
    postProcess: upsertAAPageMetrics,
  });
}
