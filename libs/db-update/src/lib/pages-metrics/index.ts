import dayjs from 'dayjs';
import {
  AdobeAnalyticsClient,
  DateRange,
  queryDateFormat,
  SearchAnalyticsClient,
  datesFromDateRange,
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
    adobeAnalyticsClient.getPageMetrics(dateRange, {
      // temporary fix for pages longer than 255 characters
      search: {
        clause: `BEGINS-WITH 'www.canada.ca' AND (BEGINS-WITH 'www.canada.ca/en/revenue-agency'\
        OR BEGINS-WITH 'www.canada.ca/fr/agence-revenu' OR BEGINS-WITH 'www.canada.ca/fr/services/impots'\
        OR BEGINS-WITH 'www.canada.ca/en/services/taxes')`,
      }
    }),
    gscClient.getPageMetrics(dateRange, { dataState: 'all' }),
  ]);

  // because there'll be potentially tens of thousands of results,
  //   we'll chunk them by date to merge them more efficiently
  const aaDates = aaResults.map((dateResults) => dateResults[0]?.date);
  const gscDates = gscResults.map((dateResults) => dateResults[0]?.date);

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
    .flat();
}

export async function updatePageMetrics() {
  await connect(getDbConnectionString());

  // Our Mongoose model, which lets us query the "pages_metrics" collection
  const pageMetricsModel: Model<Document<PageMetrics>> =
    await getPageMetricsModel();

  // get dates required for query
  const latestDateResults = await pageMetricsModel
    .findOne({}, { date: 1 })
    .sort({ date: -1 });

  // get the most recent date from the DB, and set the start date to the next day
  const latestDate = dayjs.utc(latestDateResults['date']);
  const startTime = latestDate.add(1, 'day');

  // collect data up to the start of the current day/end of the previous day
  const cutoffDate = dayjs.utc().startOf('day');

  // fetch data if our db isn't up-to-date
  if (startTime.isBefore(cutoffDate)) {
    const fullDateRange = {
      start: startTime.format(queryDateFormat),
      end: cutoffDate.format(queryDateFormat),
    };

    // to be able to iterate over each day
    const dateRanges = datesFromDateRange(fullDateRange, queryDateFormat).map(
      (date) => ({
        start: date,
        end: dayjs(date).add(1, 'day').format(queryDateFormat),
      })
    );

    for (const dateRange of dateRanges) {
      console.log(
        `\r\nFetching page metrics from AA & GSC for date: ${dateRange.start}\r\n`
      );

      const newPageMetrics = await fetchAndMergePageMetrics(dateRange);

      await pageMetricsModel.insertMany(newPageMetrics, { lean: true });

      console.log(
        `Successfully inserted page metrics data for: ${dateRange.start}`
      );
    }

    return await Promise.resolve();
  } else {
    console.log('Page metrics already up-to-date.');
  }
}

// For merging AA page metrics data with pre-existing GSC data, or inserting if no match is found
async function upsertAAPageMetrics(pageMetrics: PageMetrics[]) {
  const pageMetricsModel = getPageMetricsModel();

  return await pageMetricsModel.bulkWrite(
    pageMetrics.map((metrics) => ({
      updateOne: {
        filter: { url: metrics.url, date: metrics.date },
        update: { $set: metrics },
        upsert: true,
      }
    }))
  );
}

export async function addAAPageMetrics(dateRange: DateRange) {
  await connect(getDbConnectionString());

  const adobeAnalyticsClient = new AdobeAnalyticsClient();

  return await adobeAnalyticsClient.getPageMetrics(dateRange, {
    postProcess: upsertAAPageMetrics,
    search: {
      clause: `BEGINS-WITH 'www.canada.ca' AND (BEGINS-WITH 'www.canada.ca/en/revenue-agency'\
        OR BEGINS-WITH 'www.canada.ca/fr/agence-revenu' OR BEGINS-WITH 'www.canada.ca/fr/services/impots'\
        OR BEGINS-WITH 'www.canada.ca/en/services/taxes')`,
    },
  });
}
